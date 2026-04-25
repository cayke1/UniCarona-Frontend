import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ridesApi } from '@/lib/api';
import { normalizeRideListPayload } from '@/lib/user-types';
import { getAuthToken } from '@/lib/auth-token';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface RideMarker {
  id: string;
  originCoordinate: { latitude: number; longitude: number };
  destinationCoordinate: { latitude: number; longitude: number };
  driver: string;
  departureTime: string;
  availableSeats: number;
  origin: string;
  destination: string;
  vehicle: string;
}

function formatDepartureTime(departureAt: string): string {
  try {
    return new Date(departureAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return departureAt;
  }
}

const INITIAL_REGION: Region = {
  latitude: -10.183176410340652,
  longitude: -48.34308582836752,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

const token = getAuthToken();

async function fetchRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<RoutePoint[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAmMSguP2o5bPChxl_uasOWNtM57efCGmk';
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const points = data.routes[0].overview_polyline.points;
      return decodePolyline(points);
    }
  } catch (error) {
    console.log('Error fetching route:', error);
  }
  
  return [];
}

function decodePolyline(encoded: string): RoutePoint[] {
  const poly: RoutePoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [rides, setRides] = useState<RideMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRide, setSelectedRide] = useState<RideMarker | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }

        const userLocation = await Location.getCurrentPositionAsync({});
        setLocation(userLocation);

        const newRegion: Region = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setRegion(newRegion);
      } catch (error) {
        console.log('Location error:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    ridesApi.listAll()
      .then((payload) => {
        const normalized = normalizeRideListPayload(payload);
        const markers: RideMarker[] = normalized
          .filter(
            (r) =>
              r.originLat != null &&
              r.originLng != null &&
              r.destinationLat != null &&
              r.destinationLng != null
          )
          .map((r) => ({
            id: r.id,
            originCoordinate: { latitude: r.originLat!, longitude: r.originLng! },
            destinationCoordinate: { latitude: r.destinationLat!, longitude: r.destinationLng! },
            driver: r.driverName ?? 'Motorista',
            departureTime: r.departureAt ? formatDepartureTime(r.departureAt) : '—',
            availableSeats: r.seatsOffered ?? 0,
            origin: r.originLabel,
            destination: r.destinationLabel,
            vehicle: r.vehicle ?? 'Veículo não informado',
          }));
        setRides(markers);
      })
      .catch((err) => console.log('Erro ao buscar caronas:', err));
  }, []);

  useEffect(() => {
    if (selectedRide) {
      setLoadingRoute(true);
      fetchRoute(
        { lat: selectedRide.originCoordinate.latitude, lng: selectedRide.originCoordinate.longitude },
        { lat: selectedRide.destinationCoordinate.latitude, lng: selectedRide.destinationCoordinate.longitude }
      ).then((points) => {
        setRoutePoints(points);
        setLoadingRoute(false);
        
        mapRef.current?.fitToCoordinates(points, {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        });
      });
    } else {
      setRoutePoints([]);
    }
  }, [selectedRide]);

  const handleSelectRide = (ride: RideMarker) => {
    setSelectedRide(ride);
    setShowDropdown(false);
  };

  const handleCloseRideDetails = () => {
    setSelectedRide(null);
    setRoutePoints([]);
    mapRef.current?.animateToRegion(INITIAL_REGION, 500);
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
          <Text>Carregando localização...</Text>
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
          {token}
          {!selectedRide ? (
            rides.map((ride) => (
              <Marker
                key={`ride-${ride.id}`}
                coordinate={ride.originCoordinate}
                title={`${ride.origin} → ${ride.destination}`}
                description={`${ride.driver} • ${ride.availableSeats} vagas`}
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
                coordinate={selectedRide.originCoordinate}
                title={selectedRide.origin}
                description="Origem"
              >
                <View style={styles.originMarker}>
                  <Ionicons name="location" size={20} color="#22c55e" />
                </View>
              </Marker>
              <Marker
                coordinate={selectedRide.destinationCoordinate}
                title={selectedRide.destination}
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

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUserLocation}>
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.ridesButton} onPress={() => setShowDropdown(!showDropdown)}>
        <Text style={styles.ridesButtonText}>{rides.length} disponíveis</Text>
        <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#333" />
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.rideItem} onPress={() => handleSelectRide(item)}>
                <View style={styles.rideItemContent}>
                  <View style={styles.rideRoute}>
                    <Ionicons name="location-outline" size={16} color="#22c55e" />
                    <Text style={styles.rideText}>{item.origin}</Text>
                  </View>
                  <View style={styles.rideRoute}>
                    <Ionicons name="flag-outline" size={16} color="#ef4444" />
                    <Text style={styles.rideText}>{item.destination}</Text>
                  </View>
                  <View style={styles.rideDetails}>
                    <Text style={styles.rideDriver}>{item.driver} • {item.departureTime}</Text>
                    <Text style={styles.rideSeats}>{item.availableSeats} vagas</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {selectedRide && (
        <View style={styles.rideDetailsSheet}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseRideDetails}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.rideDetailsContent}>
            <View style={styles.carInfo}>
              <View style={styles.carIcon}>
                <Ionicons name="car-sport" size={32} color="#0066cc" />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{selectedRide.driver}</Text>
                <Text style={styles.vehicleText}>{selectedRide.vehicle}</Text>
                <Text style={styles.rideTime}>Saída: {selectedRide.departureTime}</Text>
              </View>
            </View>
            
            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <Ionicons name="location" size={20} color="#22c55e" />
                <View>
                  <Text style={styles.routeLabel}>Origem</Text>
                  <Text style={styles.routeText}>{selectedRide.origin}</Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <Ionicons name="flag" size={20} color="#ef4444" />
                <View>
                  <Text style={styles.routeLabel}>Destino</Text>
                  <Text style={styles.routeText}>{selectedRide.destination}</Text>
                </View>
              </View>
            </View>

            <View style={styles.seatsInfo}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.seatsText}>{selectedRide.availableSeats} assentos disponíveis</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton}>
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
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#22c55e',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -2,
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
  ridesInfo: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ridesInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  rideItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rideItemContent: {
    gap: 6,
  },
  rideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rideDriver: {
    fontSize: 12,
    color: '#666',
  },
  rideSeats: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  markerSelected: {
    backgroundColor: '#0066cc',
    transform: [{ scale: 1.2 }],
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
  vehicleText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  rideTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  routeInfo: {
    gap: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seatsText: {
    fontSize: 14,
    color: '#666',
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