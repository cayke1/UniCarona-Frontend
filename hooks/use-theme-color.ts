/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const semanticColors = {
  light: {
    text: colors.text.primary,
    background: colors.background.surface,
  },
  dark: {
    text: colors.neutral[100],
    background: colors.neutral[900],
  },
} as const;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof semanticColors.light
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return semanticColors[theme][colorName];
}
