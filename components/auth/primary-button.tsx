import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { CampusRideColors } from '@/constants/campus-ride-theme';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, loading, disabled }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}>
      {loading ? (
        <ActivityIndicator color={CampusRideColors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: CampusRideColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pressed: {
    backgroundColor: CampusRideColors.primaryPressed,
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    color: CampusRideColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
