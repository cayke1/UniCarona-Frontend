import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CampusRideColors } from '@/constants/campus-ride-theme';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function AuthTextField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  onToggleSecure,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={20} color={CampusRideColors.textSecondary} style={styles.leftIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {onToggleSecure ? (
        <Pressable onPress={onToggleSecure} hitSlop={8} style={styles.rightIcon}>
          <Ionicons
            name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color={CampusRideColors.textSecondary}
          />
        </Pressable>
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CampusRideColors.inputBg,
    borderWidth: 1,
    borderColor: CampusRideColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: CampusRideColors.text,
    paddingVertical: 12,
  },
  rightIcon: {
    padding: 4,
  },
  rightSpacer: {
    width: 28,
  },
});
