import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, spacing } from '@/constants/theme';

// ─── Types ──────────────────────────────────────────────────────────────────s─

export type TabKey = 'home' | 'rides' | 'profile';

export type TabItem = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
};

type TabBarProps = {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
};

// ─── Tab Definitions ─────────────────────────────────────────────────────────

const TABS: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home-outline',
    iconFilled: 'home',
  },
  {
    key: 'rides',
    label: 'Caronas',
    icon: 'car-outline',
    iconFilled: 'car',
  },
  {
    key: 'profile',
    label: 'Perfil',
    icon: 'person-outline',
    iconFilled: 'person',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TabBar({ activeTab, onTabPress }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}>
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <Ionicons
                name={isActive ? tab.iconFilled : tab.icon}
                size={22}
                color={isActive ? colors.primary[600] : colors.neutral[400]}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing[3],
    paddingBottom: Platform.OS === 'ios' ? spacing[8] : spacing[4],
    paddingHorizontal: spacing[2],
    // Shadow
    shadowColor: '#0A1929',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
    borderTopWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrapper: {
    width: 44,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: colors.primary[100],
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.neutral[400],
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primary[600],
  },
});
