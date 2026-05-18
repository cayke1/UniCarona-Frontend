import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { supportUi } from '@/components/support/support-screen-layout';
import { colors, spacing, typography } from '@/constants/theme';
import type { PreferredPaymentMethod } from '@/lib/payment-preferences';

type Props = {
  method: PreferredPaymentMethod;
  selected: boolean;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onSelect: (method: PreferredPaymentMethod) => void;
};

export function PaymentMethodOption({
  method,
  selected,
  title,
  subtitle,
  icon,
  onSelect,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
      onPress={() => onSelect(method)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}>
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons name={icon} size={22} color={selected ? supportUi.BRAND_BLUE : colors.text.secondary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={supportUi.BRAND_BLUE} />
      ) : (
        <View style={styles.radioEmpty} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.muted,
    backgroundColor: colors.background.surface,
  },
  optionSelected: {
    borderColor: supportUi.BRAND_BLUE,
    backgroundColor: '#EFF6FF',
  },
  optionPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: '#DBEAFE',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[300],
  },
});
