import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ApiError, rideApi, ridesApi } from '@/lib/api';
import { useUser } from '@/contexts/user-context';
import { isDriverUser } from '@/lib/user-types';
import type { DriverRide, MapRide, RideDetail } from '@/types/ride';

function formatTime(isoString?: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}


export default function MapScreen() {
  const { user } = useUser();
  const isDriver = !!user && isDriverUser(user);

  const [rides, setRides] = useState<MapRide[]>([]);
  const [driverRides, setDriverRides] = useState<DriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<MapRide | null>(null);
  const [rideDetail, setRideDetail] = useState<RideDetail | null>(null);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const loadDriverRides = useCallback(async () => {
    try {
      const data = await ridesApi.listMyDriverRides();
      setDriverRides(data);
    } catch {
      setDriverRides([]);
    }
  }, []);

  const loadRides = useCallback(async (lat?: number, lng?: number) => {
    setLoading(true);
    setListError(null);
    try {
      if (isDriver) {
        await loadDriverRides();
      } else {
        const data = await ridesApi.listMapRides(lat, lng);
        setRides(data);
      }
    } catch (e) {
      setRides([]);
      setListError(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar as caronas. Verifique se você está logado e a API está acessível.'
      );
    } finally {
      setLoading(false);
    }
  }, [isDriver, loadDriverRides]);

  useFocusEffect(
    useCallback(() => {
      const c = coordsRef.current;
      void loadRides(c?.lat, c?.lng);
    }, [loadRides])
  );

  useEffect(() => {
    if (isDriver) {
      void loadRides();
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      void loadRides();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        coordsRef.current = { lat, lng };
        void loadRides(lat, lng);
      },
      () => {
        void loadRides();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 }
    );
  }, [loadRides, isDriver]);

  const handleSelectRide = (ride: MapRide) => {
    setSelectedRide(ride);
    setRideDetail(null);
    rideApi
      .getById(ride.id)
      .then((detail) => setRideDetail(detail as unknown as RideDetail))
      .catch((err) => console.log('Erro ao buscar detalhes:', err));
  };

  const handleClose = () => {
    setSelectedRide(null);
    setRideDetail(null);
  };

  if (isDriver) {
    return (
      <View style={styles.container}>
        <View style={styles.driverHeader}>
          <Text style={styles.driverHeaderTitle}>Minhas caronas</Text>
          <TouchableOpacity onPress={() => void loadDriverRides()} style={styles.refreshIcon} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={22} color="#1A3FA0" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1A3FA0" />
          </View>
        ) : driverRides.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="car-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Nenhuma carona ativa</Text>
            <Text style={styles.emptySub}>Suas caronas publicadas aparecerão aqui.</Text>
            <TouchableOpacity style={styles.publishBtn} onPress={() => router.push('/publish-ride')} activeOpacity={0.85}>
              <Text style={styles.publishBtnText}>Publicar carona</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={driverRides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const count = item.pendingRequests.length;
              const hasPending = count > 0;
              return (
                <TouchableOpacity style={styles.rideCard} onPress={() => router.push(`/ride/${item.id}`)} activeOpacity={0.75}>
                  <View style={styles.rideHeader}>
                    <View style={styles.carIcon}>
                      <Ionicons name="car-sport" size={28} color="#1A3FA0" />
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName} numberOfLines={1}>{item.originAddress}</Text>
                      <Text style={styles.metaText} numberOfLines={1}>{item.destinationAddress}</Text>
                    </View>
                    <View style={[styles.seatsBadge, hasPending && styles.seatsBadgePending]}>
                      <Text style={[styles.seatsText, hasPending && styles.seatsTextPending]}>
                        {item.availableSeats}/{item.totalSeats}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#6B7A99" />
                    <Text style={styles.metaText}>{formatTime(item.departureTime)} · {formatDate(item.departureTime)}</Text>
                    {hasPending && (
                      <View style={styles.pendingBadge}>
                        <Ionicons name="notifications-outline" size={12} color="#D97706" />
                        <Text style={styles.pendingText}>{count} pendente{count > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Ionicons name="map-outline" size={18} color="#0066cc" />
        <Text style={styles.bannerText}>
          Mapa interativo no app mobile. Abaixo, caronas disponíveis próximas à sua localização.
        </Text>
      </View>

      {listError ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={22} color="#991b1b" />
          <Text style={styles.errorText}>{listError}</Text>
          <TouchableOpacity
            onPress={() => void loadRides(coordsRef.current?.lat, coordsRef.current?.lng)}>
            <Text style={styles.retry}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>
        {loading ? 'Carregando caronas…' : `Caronas disponíveis (${rides.length})`}
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="car-outline" size={40} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Nenhuma carona disponível</Text>
          <Text style={styles.emptySub}>
            Não há caronas ativas no momento ou nenhuma próximo à sua posição.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.rideCard} onPress={() => handleSelectRide(item)}>
              <View style={styles.rideHeader}>
                <View style={styles.carIcon}>
                  <Ionicons name="car-sport" size={28} color="#0066cc" />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{item.driver.name}</Text>
                  <Text style={styles.metaText}>
                    {formatTime(item.departureTime)} · {formatDate(item.departureTime)}
                  </Text>
                </View>
                <View style={styles.seatsBadge}>
                  <Text style={styles.seatsText}>{item.availableSeats} vagas</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.priceText}>R$ {item.costPerSeat.toFixed(2)} / assento</Text>
                {item.distanceKm > 0 && <Text style={styles.distText}>{item.distanceKm} km</Text>}
              </View>

            </TouchableOpacity>
          )}
        />
      )}

      {selectedRide ? (
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.carInfo}>
              <View style={styles.carIconLarge}>
                <Ionicons name="car-sport" size={36} color="#0066cc" />
              </View>
              <View>
                <Text style={styles.driverNameLarge}>{selectedRide.driver.name}</Text>
                <Text style={styles.metaText}>
                  Saída: {formatTime(selectedRide.departureTime)} · {formatDate(selectedRide.departureTime)}
                </Text>
                <Text style={styles.priceLarge}>R$ {selectedRide.costPerSeat.toFixed(2)} por assento</Text>

              </View>
            </View>
            <View style={styles.routeInfo}>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={20} color="#22c55e" />
                <View>
                  <Text style={styles.routeLabel}>Origem</Text>
                  {rideDetail ? (
                    <Text style={styles.routeTextLarge}>{rideDetail.originAddress}</Text>
                  ) : (
                    <ActivityIndicator size="small" color="#999" />
                  )}
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <Ionicons name="flag" size={20} color="#ef4444" />
                <View>
                  <Text style={styles.routeLabel}>Destino</Text>
                  {rideDetail ? (
                    <Text style={styles.routeTextLarge}>{rideDetail.destinationAddress}</Text>
                  ) : (
                    <ActivityIndicator size="small" color="#999" />
                  )}
                </View>
              </View>
            </View>
            <View style={styles.seatsRow}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.seatsDetail}>
                {selectedRide.availableSeats} assentos disponíveis
              </Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/ride/${selectedRide.id}`)}>
              <Text style={styles.actionButtonText}>Acionar carona</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#e6f0ff',
    padding: 12,
    margin: 16,
    borderRadius: 10,
  },
  bannerText: { flex: 1, color: '#0066cc', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  center: { paddingVertical: 40, alignItems: 'center' },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  errorText: { fontSize: 13, color: '#991b1b', lineHeight: 18 },
  retry: { fontSize: 14, fontWeight: '700', color: '#0066cc' },
  emptyBox: {
    marginHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rideHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  carIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '600', color: '#333' },
  metaText: { fontSize: 12, color: '#888', marginTop: 2 },
  seatsBadge: {
    backgroundColor: '#e6ffe6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  seatsText: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceText: { fontSize: 14, fontWeight: '700', color: '#0066cc' },
  distText: { fontSize: 12, color: '#64748b' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 2 },
  carInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  carIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverNameLarge: { fontSize: 18, fontWeight: '700', color: '#333' },
  priceLarge: { fontSize: 15, fontWeight: '600', color: '#0066cc', marginTop: 4 },
  routeInfo: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeLine: { width: 2, height: 20, backgroundColor: '#e0e0e0', marginLeft: 10 },
  routeLabel: { fontSize: 11, color: '#aaa' },
  routeTextLarge: { fontSize: 15, fontWeight: '500', color: '#333' },
  seatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seatsDetail: { fontSize: 14, color: '#666' },
  actionButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  driverHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#0D1B3E', letterSpacing: -0.5 },
  refreshIcon: { padding: 6 },
  seatsBadgePending: { backgroundColor: '#FEF3C7' },
  seatsTextPending: { color: '#D97706' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pendingText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  publishBtn: { marginTop: 12, backgroundColor: '#2E5BE8', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  publishBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
