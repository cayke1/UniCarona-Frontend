import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { CampusRideColors } from '@/constants/campus-ride-theme';

export type ButtonVariant = 'primary' | 'outlined' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
};

export function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary' }: Props) {
  const isDisabled = disabled || loading;
  const isDanger = variant === 'danger';
  const isOutlined = variant === 'outlined';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        isDanger ? styles.btnDanger : isOutlined ? styles.btnOutlined : styles.btnPrimary,
        pressed && !isDisabled &&
          (isDanger ? styles.pressedDanger : isOutlined ? styles.pressedOutlined : styles.pressedPrimary),
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}>
      {loading ? (
        <ActivityIndicator color={isOutlined ? '#dc2626' : CampusRideColors.white} />
      ) : (
        <Text style={[styles.label, isOutlined && styles.labelOutlined]}>{label}</Text>
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
    borderWidth: 1,
    borderColor: CampusRideColors.primary,
  },
  pressedPrimary: {
    backgroundColor: CampusRideColors.primaryPressed,
    borderColor: CampusRideColors.primaryPressed,
  },
  btnOutlined: {
    backgroundColor: CampusRideColors.white,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  pressedOutlined: {
    backgroundColor: CampusRideColors.infoBg,
    borderColor: CampusRideColors.primaryPressed,
  },
  btnDanger: {
    backgroundColor: '#dc2626',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  pressedDanger: {
    backgroundColor: '#b91c1c',
    borderColor: '#b91c1c',
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    color: CampusRideColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  labelOutlined: {
    color: '#dc2626',
  },
});
