import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AUTH_MAX_CONTENT_WIDTH } from '@/constants/campus-ride-theme';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

const BRAND_BLUE = '#2563EB';
const PAGE_BG = '#F4F6FB';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SupportScreenLayout({ title, subtitle, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Voltar">
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{title}</Text>
              {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
            </View>
            <View style={styles.headerSpacer} />
          </View>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export const supportUi = {
  BRAND_BLUE,
  PAGE_BG,
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.muted,
    padding: spacing[4],
  } as const,
  sectionLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[500],
    letterSpacing: 0.6,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  } as const,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  headerText: {
    flex: 1,
    paddingHorizontal: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing[10],
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    gap: spacing[4],
  },
});
