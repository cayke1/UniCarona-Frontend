import { Ionicons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapScreen from '@/components/map-screen';
import { useUser } from '@/contexts/user-context';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

/**
 * Mapa (T-21+) + atalhos do sprint motorista (perfil, publicar / tornar-se motorista).
 */
export default function HomeScreen() {
  const { user, loading } = useUser();
  const isDriver = user?.role === 'MOTORISTA';

  return (
    <View style={styles.root}>
      <MapScreen />
      <SafeAreaView style={styles.overlaySafe} edges={['top']} pointerEvents="box-none">
        <View style={styles.quickRow} pointerEvents="box-none">
          <Link href={'/(tabs)/profile' as Href} asChild>
            <Pressable style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}>
              <Ionicons name="person-circle-outline" size={20} color={colors.primary[700]} />
              <Text style={styles.quickLabel}>Perfil</Text>
            </Pressable>
          </Link>
          {user && isDriver ? (
            <Link href={'/publish-ride' as Href} asChild>
              <Pressable style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}>
                <Ionicons name="add-circle-outline" size={20} color={colors.success[800]} />
                <Text style={styles.quickLabel}>Publicar</Text>
              </Pressable>
            </Link>
          ) : user ? (
            <Link href={'/become-driver' as Href} asChild>
              <Pressable style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}>
                <Ionicons name="rocket-outline" size={20} color={colors.warning[800]} />
                <Text style={styles.quickLabel}>Motorista</Text>
              </Pressable>
            </Link>
          ) : !loading ? (
            <View style={styles.quickHint}>
              <Text style={styles.quickHintText}>Login para atalhos</Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlaySafe: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  quickChipPressed: {
    opacity: 0.9,
  },
  quickLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  quickHint: {
    alignSelf: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  quickHintText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});
