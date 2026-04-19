import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DriverRideScreen from '@/components/DriverRideScreen';
import PassengerRideScreen from '@/components/PassengerRideScreen';
import { Ride } from '@/types/ride';

const MOCK_RIDE: Ride = {
  id: 'mock-2940-abcd',
  driver: {
    id: 'driver-001',
    name: 'Lucas Farias',
    rating: 4.9,
    vehicle: 'Honda Civic Prata 2022',
  },
  origin: 'Metro Butantã',
  destination: 'Poli-USP (Prédio de Mecânica)',
  originCoordinate: { latitude: -23.5878, longitude: -46.7191 },
  destinationCoordinate: { latitude: -23.5591, longitude: -46.7317 },
  departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  availableSeats: 2,
  totalSeats: 4,
  price: 9.0,
  status: 'open',
  passengerRequests: [
    {
      id: 'req-1',
      userId: 'passenger-001',
      name: 'Beatriz Santos',
      initials: 'BS',
      course: 'Politécnica',
      price: 9.0,
      verified: true,
      status: 'pending',
    },
    {
      id: 'req-2',
      userId: 'passenger-002',
      name: 'Ricardo Mendonça',
      initials: 'RM',
      course: 'Arquitetura',
      price: 9.0,
      verified: true,
      status: 'pending',
    },
  ],
};

type Role = 'driver' | 'passenger' | 'passenger-pending' | 'passenger-accepted';

const ROLE_LABELS: Record<Role, string> = {
  driver: 'Motorista',
  passenger: 'Passageiro (livre)',
  'passenger-pending': 'Passageiro (pendente)',
  'passenger-accepted': 'Passageiro (confirmado)',
};

export default function RidePreview() {
  const [role, setRole] = useState<Role>('driver');

  if (role === 'driver') {
    return (
      <View style={{ flex: 1 }}>
        <RoleToggle current={role} onChange={setRole} />
        <DriverRideScreen ride={MOCK_RIDE} />
      </View>
    );
  }

  const passengerUserId =
    role === 'passenger'
      ? 'unknown-user'
      : role === 'passenger-pending'
      ? 'passenger-001'
      : 'passenger-accepted-user';

  const rideForPassenger: Ride =
    role === 'passenger-accepted'
      ? {
          ...MOCK_RIDE,
          passengerRequests: [
            {
              id: 'req-accepted',
              userId: 'passenger-accepted-user',
              name: 'Eu mesmo',
              initials: 'EU',
              price: 9.0,
              verified: true,
              status: 'accepted',
            },
          ],
        }
      : MOCK_RIDE;

  return (
    <View style={{ flex: 1 }}>
      <RoleToggle current={role} onChange={setRole} />
      <PassengerRideScreen ride={rideForPassenger} userId={passengerUserId} />
    </View>
  );
}

function RoleToggle({ current, onChange }: { current: Role; onChange: (r: Role) => void }) {
  const roles: Role[] = ['driver', 'passenger', 'passenger-pending', 'passenger-accepted'];
  return (
    <View style={styles.toggleBar}>
      <Text style={styles.toggleTitle}>Preview:</Text>
      <View style={styles.toggleRow}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.toggleBtn, current === r && styles.toggleBtnActive]}
            onPress={() => onChange(r)}
            activeOpacity={0.8}>
            <Text style={[styles.toggleBtnText, current === r && styles.toggleBtnTextActive]}>
              {ROLE_LABELS[r]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleBar: {
    backgroundColor: '#1A3FA0',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    gap: 8,
  },
  toggleTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toggleBtnActive: { backgroundColor: '#FFFFFF' },
  toggleBtnText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  toggleBtnTextActive: { color: '#1A3FA0' },
});
