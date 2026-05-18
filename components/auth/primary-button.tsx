import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CampusRideColors } from '@/constants/campus-ride-theme';

export type ButtonVariant = 'primary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: Props) {
  const isDisabled = disabled || loading;
  const isDanger = variant === 'danger';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        isDanger ? styles.btnDanger : styles.btnPrimary,
        pressed && !isDisabled && (isDanger ? styles.pressedDanger : styles.pressedPrimary),
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}>
      {loading ? (
        <ActivityIndicator color={CampusRideColors.white} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={22} color={CampusRideColors.white} /> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  btnPrimary: {
    backgroundColor: CampusRideColors.primary,
  },
  pressedPrimary: {
    backgroundColor: CampusRideColors.primaryPressed,
  },
  btnDanger: {
    backgroundColor: '#dc2626',
  },
  pressedDanger: {
    backgroundColor: '#b91c1c',
  },
  disabled: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    color: CampusRideColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
