import { Ionicons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUser } from '@/contexts/user-context';
import { AUTH_MAX_CONTENT_WIDTH } from '@/constants/campus-ride-theme';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

export default function HomeScreen() {
  const { user, loading } = useUser();
  const isDriver = user?.role === 'MOTORISTA';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.kicker}>UniCarona</Text>
          <Text style={styles.title}>Campus Ride</Text>
          <Text style={styles.subtitle}>
            Divida trajetos com colegas, com perfil de passageiro ou motorista em um só lugar.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sua sessão</Text>
            {loading ? (
              <Text style={styles.cardMuted}>Carregando...</Text>
            ) : user ? (
              <>
                <Text style={styles.cardName}>{user.name}</Text>
                <View style={[styles.badge, isDriver ? styles.badgeDriver : styles.badgePassenger]}>
                  <Text style={styles.badgeText}>{isDriver ? 'Motorista' : 'Passageiro'}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.cardMuted}>
                Faça login para sincronizar seu nome, papel e atalhos de motorista.
              </Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Atalhos</Text>
          <View style={styles.actions}>
            <Link href={'/profile' as Href} asChild>
              <Pressable style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                <View style={styles.actionIcon}>
                  <Ionicons name="person-circle-outline" size={24} color={colors.primary[700]} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Perfil</Text>
                  <Text style={styles.actionSub}>Saldo, PIX e caronas ativas</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </Pressable>
            </Link>

            {user && isDriver ? (
              <Link href={'/publish-ride' as Href} asChild>
                <Pressable style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                  <View style={[styles.actionIcon, styles.actionIconAlt]}>
                    <Ionicons name="add-circle-outline" size={24} color={colors.success[800]} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Publicar carona</Text>
                    <Text style={styles.actionSub}>Origem, destino e prévia de custo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </Pressable>
              </Link>
            ) : user ? (
              <Link href={'/become-driver' as Href} asChild>
                <Pressable style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                  <View style={[styles.actionIcon, styles.actionIconAlt]}>
                    <Ionicons name="rocket-outline" size={24} color={colors.warning[800]} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Tornar-se motorista</Text>
                    <Text style={styles.actionSub}>PIX e promoção de perfil</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </Pressable>
              </Link>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    paddingBottom: spacing[10],
    paddingTop: spacing[4],
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  kicker: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary[700],
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing[2],
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.muted,
    padding: spacing[4],
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardMuted: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  cardName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  badgePassenger: {
    backgroundColor: colors.primary[50],
  },
  badgeDriver: {
    backgroundColor: colors.success[100],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  actions: {
    gap: spacing[3],
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[3],
  },
  actionPressed: {
    opacity: 0.92,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconAlt: {
    backgroundColor: colors.success[50],
  },
  actionTextWrap: {
    flex: 1,
    gap: spacing[0.5],
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  actionSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});
