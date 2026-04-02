import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? { color: tintColor } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  defaultSemiBold: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    fontWeight: '600',
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  },
  subtitle: {
    fontFamily: Fonts.rounded,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
  },
});
