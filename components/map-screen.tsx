import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ApiError, ridesApi, rideApi } from '@/lib/api';
import type { MapRide, RideDetail } from '@/types/ride';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

const INITIAL_REGION: Region = {
  latitude: -10.183176410340652,
  longitude: -48.34308582836752,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

function formatDate(isoString: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatTime(isoString: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

async function fetchRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RoutePoint[]> {
  try {
    const data = await ridesApi.routeGeometry({
      originLat: origin.lat,
      originLng: origin.lng,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
    });
    return data.coordinates;
  } catch (error) {
    console.log('Error fetching route:', error);
  }
  return [];
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [rides, setRides] = useState<MapRide[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [ridesListError, setRidesListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRide, setSelectedRide] = useState<MapRide | null>(null);
  const [rideDetail, setRideDetail] = useState<RideDetail | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const fetchRides = useCallback(async (lat?: number, lng?: number) => {
    setLoadingRides(true);
    setRidesListError(null);
    try {
      const data = await ridesApi.listMapRides(lat, lng);
      setRides(data);
    } catch (error) {
      console.log('Error fetching rides:', error);
      setRides([]);
      setRidesListError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar as caronas. Verifique a conexão e tente de novo.'
      );
    } finally {
      setLoadingRides(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const lat = location?.coords.latitude;
      const lng = location?.coords.longitude;
      void fetchRides(lat, lng);
    }, [location, fetchRides])
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          await fetchRides();
          setLoading(false);
          return;
        }

        const userLocation = await Location.getCurrentPositionAsync({});
        setLocation(userLocation);

        const { latitude, longitude } = userLocation.coords;
        setRegion({ latitude, longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 });
        await fetchRides(latitude, longitude);
      } catch (error) {
        console.log('Location error:', error);
        await fetchRides();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchRides]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (selectedRide) {
      setLoadingRoute(true);
      setRideDetail(null);
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      (async () => {
        const points = await fetchRoute(
          { lat: selectedRide.originLat, lng: selectedRide.originLng },
          { lat: selectedRide.destinationLat, lng: selectedRide.destinationLng }
        );
        if (controller.signal.aborted) return;
        setRoutePoints(points);
        setLoadingRoute(false);
        if (points.length > 0) {
          mapRef.current?.fitToCoordinates(points, {
            edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
            animated: true,
          });
        }
      })();

      rideApi.getById(selectedRide.id)
        .then((detail) => {
          if (controller.signal.aborted) return;
          setRideDetail(detail as unknown as RideDetail);
        })
        .catch((err) => console.log('Error fetching ride detail:', err));
    } else {
      abortControllerRef.current?.abort();
      setRoutePoints([]);
      setRideDetail(null);
    }
  }, [selectedRide]);

  const handleSelectRide = (ride: MapRide) => {
    setSelectedRide(ride);
    setShowDropdown(false);
  };

  const handleCloseRideDetails = () => {
    setSelectedRide(null);
    setRoutePoints([]);
    setRideDetail(null);
    const resetRegion = location
      ? { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }
      : INITIAL_REGION;
    mapRef.current?.animateToRegion(resetRegion, 500);
  };

  const centerOnUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingTitle}>Carregando mapa e caronas…</Text>
          <Text style={styles.loadingSub}>Buscando caronas ativas no servidor</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          onRegionChangeComplete={setRegion}
        >
          {!selectedRide ? (
            rides.map((ride) => (
              <Marker
                key={`ride-${ride.id}`}
                coordinate={{ latitude: ride.originLat, longitude: ride.originLng }}
                description={`${ride.driver.name} • ${ride.availableSeats} vagas`}
                onPress={() => handleSelectRide(ride)}
              >
                <View style={styles.rideMarker}>
                  <Ionicons name="car" size={20} color="#fff" />
                </View>
              </Marker>
            ))
          ) : (
            <>
              <Marker
                coordinate={{ latitude: selectedRide.originLat, longitude: selectedRide.originLng }}
                title={rideDetail?.originAddress ?? 'Origem'}
                description="Origem"
              >
                <View style={styles.originMarker}>
                  <Ionicons name="location" size={20} color="#22c55e" />
                </View>
              </Marker>
              <Marker
                coordinate={{ latitude: selectedRide.destinationLat, longitude: selectedRide.destinationLng }}
                title={rideDetail?.destinationAddress ?? 'Destino'}
                description="Destino"
              >
                <View style={styles.destinationMarker}>
                  <Ionicons name="flag" size={20} color="#ef4444" />
                </View>
              </Marker>
              {routePoints.length > 0 && (
                <Polyline
                  coordinates={routePoints}
                  strokeColor="#0066cc"
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </>
          )}
        </MapView>
      )}

      {!loading && ridesListError ? (
        <View style={styles.errorBanner} pointerEvents="box-none">
          <Ionicons name="cloud-offline-outline" size={18} color="#991b1b" />
          <Text style={styles.errorBannerText}>{ridesListError}</Text>
          <TouchableOpacity
            onPress={() => {
              const lat = location?.coords.latitude;
              const lng = location?.coords.longitude;
              void fetchRides(lat, lng);
            }}
            hitSlop={8}>
            <Text style={styles.errorBannerRetry}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !loadingRides && !selectedRide && rides.length === 0 && !ridesListError ? (
        <View style={styles.emptyMapHint} pointerEvents="none">
          <Ionicons name="car-outline" size={22} color="#64748b" />
          <Text style={styles.emptyMapHintTitle}>Nenhuma carona disponível</Text>
          <Text style={styles.emptyMapHintSub}>
            Não há caronas ativas no momento ou nenhuma próxima da sua região.
          </Text>
        </View>
      ) : null}

      {!loading && loadingRides ? (
        <View style={styles.refreshHint} pointerEvents="none">
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.refreshHintText}>Atualizando caronas…</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUserLocation}>
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.ridesButton} onPress={() => setShowDropdown(!showDropdown)}>
        {loadingRides ? (
          <ActivityIndicator size="small" color="#333" />
        ) : (
          <Text style={styles.ridesButtonText}>
            {rides.length === 0 ? 'Nenhuma carona' : `${rides.length} disponíveis`}
          </Text>
        )}
        <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#333" />
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdown}>
          {rides.length === 0 ? (
            <View style={styles.emptyDropdown}>
              <Text style={styles.emptyDropdownText}>Nenhuma carona disponível</Text>
            </View>
          ) : (
            <FlatList
              data={rides}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.rideItem} onPress={() => handleSelectRide(item)}>
                  <View style={styles.rideItemContent}>
                    <View style={styles.rideItemHeader}>
                      <Ionicons name="person-circle-outline" size={18} color="#0066cc" />
                      <Text style={styles.rideDriverName}>{item.driver.name}</Text>
                      <Text style={styles.rideDepartureTime}>
                        {formatTime(item.departureTime)} · {formatDate(item.departureTime)}
                      </Text>
                    </View>
                    <View style={styles.rideDetails}>
                      <Text style={styles.rideSeats}>{item.availableSeats} vagas</Text>
                      <Text style={styles.rideCost}>R$ {item.costPerSeat.toFixed(2)}</Text>
                      {item.distanceKm > 0 && (
                        <Text style={styles.rideDistance}>{item.distanceKm} km</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {selectedRide && (
        <View style={styles.rideDetailsSheet}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseRideDetails}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {loadingRoute && routePoints.length === 0 ? (
            <View style={styles.routeLoadingRow}>
              <ActivityIndicator size="small" color="#0066cc" />
              <Text style={styles.routeLoadingText}>Carregando rota no mapa…</Text>
            </View>
          ) : null}

          <View style={styles.rideDetailsContent}>
            <View style={styles.carInfo}>
              <View style={styles.carIcon}>
                <Ionicons name="car-sport" size={32} color="#0066cc" />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{selectedRide.driver.name}</Text>
                <Text style={styles.rideTime}>
                  Saída: {formatTime(selectedRide.departureTime)} ·{' '}
                  {formatDate(selectedRide.departureTime)}
                </Text>
                <Text style={styles.rideCostLabel}>
                  R$ {selectedRide.costPerSeat.toFixed(2)} por assento
                </Text>
              </View>
            </View>

            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <Ionicons name="location" size={20} color="#22c55e" />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.routeLabel}>Origem</Text>
                  {rideDetail ? (
                    <Text style={styles.routeText} numberOfLines={2}>
                      {rideDetail.originAddress}
                    </Text>
                  ) : (
                    <ActivityIndicator size="small" color="#999" style={styles.addressLoader} />
                  )}
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <Ionicons name="flag" size={20} color="#ef4444" />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.routeLabel}>Destino</Text>
                  {rideDetail ? (
                    <Text style={styles.routeText} numberOfLines={2}>
                      {rideDetail.destinationAddress}
                    </Text>
                  ) : (
                    <ActivityIndicator size="small" color="#999" style={styles.addressLoader} />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.seatsInfo}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.seatsText}>{selectedRide.availableSeats} assentos disponíveis</Text>
              {selectedRide.distanceKm > 0 && (
                <>
                  <View style={styles.seatsSeparator} />
                  <Ionicons name="navigate-outline" size={16} color="#999" />
                  <Text style={styles.distanceText}>{selectedRide.distanceKm} km</Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/ride/${selectedRide.id}`)}>
            <Text style={styles.actionButtonText}>Acionar carona</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  errorBannerRetry: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066cc',
  },
  emptyMapHint: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyMapHintTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptyMapHintSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 17,
  },
  refreshHint: {
    position: 'absolute',
    top: 108,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  routeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  routeLoadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  map: {
    flex: 1,
  },
  rideMarker: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  originMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#22c55e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  ridesButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ridesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dropdown: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyDropdown: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#999',
  },
  rideItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rideItemContent: {
    gap: 6,
  },
  rideItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rideDriverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  rideDepartureTime: {
    fontSize: 12,
    color: '#666',
  },
  rideDetails: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 24,
  },
  rideSeats: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  rideCost: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
  },
  rideDistance: {
    fontSize: 12,
    color: '#999',
  },
  rideDetailsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  rideDetailsContent: {
    padding: 20,
    gap: 16,
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  carIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  rideTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  rideCostLabel: {
    fontSize: 13,
    color: '#0066cc',
    fontWeight: '600',
    marginTop: 2,
  },
  routeInfo: {
    gap: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 9,
  },
  routeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  addressLoader: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatsText: {
    fontSize: 14,
    color: '#666',
  },
  seatsSeparator: {
    width: 1,
    height: 14,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
  },
  distanceText: {
    fontSize: 13,
    color: '#999',
  },
  actionButton: {
    marginHorizontal: 20,
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
