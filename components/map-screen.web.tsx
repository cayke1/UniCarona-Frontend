import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ridesApi, rideApi } from '@/lib/api';
import type { MapRide, RideDetail } from '@/types/ride';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function MapScreen() {
  const [rides, setRides] = useState<MapRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<MapRide | null>(null);
  const [rideDetail, setRideDetail] = useState<RideDetail | null>(null);

  useEffect(() => {
    ridesApi.listMapRides()
      .then(setRides)
      .catch((err) => console.log('Erro ao buscar caronas:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectRide = (ride: MapRide) => {
    setSelectedRide(ride);
    setRideDetail(null);
    rideApi.getById(ride.id)
      .then((detail) => setRideDetail(detail as unknown as RideDetail))
      .catch((err) => console.log('Erro ao buscar detalhes:', err));
  };

  const handleClose = () => {
    setSelectedRide(null);
    setRideDetail(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Ionicons name="map-outline" size={18} color="#0066cc" />
        <Text style={styles.bannerText}>Mapa disponível apenas no app mobile</Text>
      </View>

      <Text style={styles.sectionTitle}>Caronas disponíveis</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#0066cc" />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma carona disponível</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.rideCard} onPress={() => handleSelectRide(item)}>
              <View style={styles.rideHeader}>
                <View style={styles.carIcon}>
                  <Ionicons name="car-sport" size={28} color="#0066cc" />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{item.driver.name}</Text>
                  <Text style={styles.timeText}>
                    {formatTime(item.departureTime)} · {formatDate(item.departureTime)}
                  </Text>
                </View>
                <View style={styles.seatsBadge}>
                  <Text style={styles.seatsText}>{item.availableSeats} vagas</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.costText}>R$ {item.costPerSeat.toFixed(2)} / assento</Text>
                {item.distanceKm > 0 && (
                  <Text style={styles.distanceText}>{item.distanceKm} km</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {selectedRide && (
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
                <Text style={styles.timeText}>
                  Saída: {formatTime(selectedRide.departureTime)} · {formatDate(selectedRide.departureTime)}
                </Text>
                <Text style={styles.costText}>R$ {selectedRide.costPerSeat.toFixed(2)} por assento</Text>
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
              <Text style={styles.seatsDetail}>{selectedRide.availableSeats} assentos disponíveis</Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/ride/${selectedRide.id}`)}>
              <Text style={styles.actionButtonText}>Acionar carona</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e6f0ff',
    padding: 12,
    margin: 16,
    borderRadius: 10,
  },
  bannerText: { color: '#0066cc', fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginHorizontal: 16, marginBottom: 8 },
  loader: { marginTop: 32 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
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
  timeText: { fontSize: 12, color: '#999', marginTop: 2 },
  seatsBadge: {
    backgroundColor: '#e6ffe6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  seatsText: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  metaRow: { flexDirection: 'row', gap: 12 },
  costText: { fontSize: 13, color: '#0066cc', fontWeight: '600' },
  distanceText: { fontSize: 13, color: '#999' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
  closeButton: { position: 'absolute', top: 16, right: 16 },
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
});
