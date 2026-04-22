import { Ionicons } from '@expo/vector-icons';
import { type Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import MapScreen from '@/components/map-screen';
import { useUser } from '@/contexts/user-context';

export default function HomeScreen() {
  const { user } = useUser();
  const isDriver = user?.role === 'MOTORISTA';

  return (
    <View style={styles.root}>
      <MapScreen />

      {/* FAB de ação — posicionado acima do botão de localização, no canto inferior direito */}
      {user && (
        <Link href={(isDriver ? '/publish-ride' : '/become-driver') as Href} asChild>
          <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
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
  },
  fab: {
    position: 'absolute',
    bottom: 165,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A3FA0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
