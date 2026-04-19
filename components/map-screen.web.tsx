import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const DEMO_RIDES: RideMarker[] = [
  {
    id: '1',
    originCoordinate: { latitude: -10.183176, longitude: -48.343085 },
    destinationCoordinate: { latitude: -10.190456, longitude: -48.325891 },
    driver: 'João Silva',
    departureTime: '14:30',
    availableSeats: 3,
    origin: 'Centro',
    destination: 'Norte',
    vehicle: 'Honda Civic - Prata',
  },
  {
    id: '2',
    originCoordinate: { latitude: -10.175621, longitude: -48.351200 },
    destinationCoordinate: { latitude: -10.169234, longitude: -48.310456 },
    driver: 'Maria Santos',
    departureTime: '15:00',
    availableSeats: 2,
    origin: 'Plano Diretor Sul',
    destination: 'Aureny II',
    vehicle: 'Toyota Corolla - Branco',
  },
  {
    id: '3',
    originCoordinate: { latitude: -10.195123, longitude: -48.355678 },
    destinationCoordinate: { latitude: -10.183176, longitude: -48.343085 },
    driver: 'Carlos Oliveira',
    departureTime: '14:45',
    availableSeats: 1,
    origin: 'Taquaretinga',
    destination: 'Centro',
    vehicle: 'Ford Ka - Preto',
  },
];

export default function MapScreen() {
  const [rides] = useState<RideMarker[]>(DEMO_RIDES);
  const [selectedRide, setSelectedRide] = useState<RideMarker | null>(null);

  const handleSelectRide = (ride: RideMarker) => setSelectedRide(ride);
  const handleClose = () => setSelectedRide(null);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Ionicons name="map-outline" size={18} color="#0066cc" />
        <Text style={styles.bannerText}>Mapa disponível apenas no app mobile</Text>
      </View>

      <Text style={styles.sectionTitle}>Caronas disponíveis</Text>

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
                <Text style={styles.driverName}>{item.driver}</Text>
                <Text style={styles.vehicleText}>{item.vehicle}</Text>
              </View>
              <View style={styles.seatsBadge}>
                <Text style={styles.seatsText}>{item.availableSeats} vagas</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color="#22c55e" />
              <Text style={styles.routeText}>{item.origin}</Text>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="flag" size={16} color="#ef4444" />
              <Text style={styles.routeText}>{item.destination}</Text>
            </View>
            <Text style={styles.timeText}>Saída: {item.departureTime}</Text>
          </TouchableOpacity>
        )}
      />

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
                <Text style={styles.driverNameLarge}>{selectedRide.driver}</Text>
                <Text style={styles.vehicleText}>{selectedRide.vehicle}</Text>
                <Text style={styles.timeText}>Saída: {selectedRide.departureTime}</Text>
              </View>
            </View>
            <View style={styles.routeInfo}>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={20} color="#22c55e" />
                <View>
                  <Text style={styles.routeLabel}>Origem</Text>
                  <Text style={styles.routeTextLarge}>{selectedRide.origin}</Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <Ionicons name="flag" size={20} color="#ef4444" />
                <View>
                  <Text style={styles.routeLabel}>Destino</Text>
                  <Text style={styles.routeTextLarge}>{selectedRide.destination}</Text>
                </View>
              </View>
            </View>
            <View style={styles.seatsRow}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.seatsDetail}>{selectedRide.availableSeats} assentos disponíveis</Text>
            </View>
            <TouchableOpacity style={styles.actionButton}>
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
  vehicleText: { fontSize: 12, color: '#888', marginTop: 2 },
  seatsBadge: {
    backgroundColor: '#e6ffe6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  seatsText: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontSize: 14, color: '#555' },
  timeText: { fontSize: 12, color: '#999', marginTop: 2 },
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
