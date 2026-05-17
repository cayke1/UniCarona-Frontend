import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { type Href } from 'expo-router';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import MapScreen from '@/components/map-screen';
import { useUser } from '@/contexts/user-context';

const FAB_SIZE = 50;
const FAB_MARGIN = 10;

export default function HomeScreen() {
  const { user } = useUser();
  const isDriver = user?.role === 'MOTORISTA';
  const tabBarHeight = useBottomTabBarHeight();
  const fabBottom = tabBarHeight + FAB_MARGIN;
  const [emptyRidesOverlay, setEmptyRidesOverlay] = useState(false);
  const [rideDetailOpen, setRideDetailOpen] = useState(false);

  return (
    <View style={[styles.root, { marginBottom: -tabBarHeight }]}>
      <MapScreen
        mapBottomInset={tabBarHeight}
        onEmptyRidesOverlayChange={setEmptyRidesOverlay}
        onRideDetailOpenChange={setRideDetailOpen}
      />

      {user && !emptyRidesOverlay && !rideDetailOpen && (
        <Link href={(isDriver ? '/publish-ride' : '/become-driver') as Href} asChild>
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { bottom: fabBottom, width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2 },
              pressed && styles.fabPressed,
            ]}
            hitSlop={4}>
            <Ionicons
              name={isDriver ? 'add' : 'rocket-outline'}
              size={26}
              color="#FFFFFF"
            />
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    backgroundColor: '#1A3FA0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
