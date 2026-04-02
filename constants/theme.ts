import { Platform } from 'react-native';

export const colors = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  secondary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  background: {
    canvas: '#F7FAFC',
    surface: '#FFFFFF',
    elevated: '#EEF4FA',
    muted: '#EAF1F7',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#D7E0EA',
    muted: '#E6EDF5',
    focus: '#0EA5E9',
    error: '#EF4444',
    success: '#22C55E',
  },
} as const;

export const Colors = {
  light: {
    background: colors.background.canvas,
    surface: colors.background.surface,
    text: colors.text.primary,
    tint: colors.primary[600],
    icon: colors.text.secondary,
    tabIconDefault: colors.text.secondary,
    tabIconSelected: colors.primary[600],
    border: colors.border.default,
  },
  dark: {
    background: '#0B1220',
    surface: '#111827',
    text: '#F8FAFC',
    tint: colors.primary[400],
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: colors.primary[400],
    border: '#243244',
  },
} as const;

const fontFamilies = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
}) as { sans: string; serif: string; rounded: string; mono: string };

export const Fonts = fontFamilies;

export const typography = {
  fontFamily: {
    body: fontFamilies.sans,
    display: fontFamilies.rounded,
    mono: fontFamilies.mono,
    serif: fontFamilies.serif,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.02,
  },
} as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const borderWidth = {
  xs: 1,
  sm: 2,
  md: 3,
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  md: '0 10px 25px rgba(15, 23, 42, 0.10)',
  lg: '0 18px 40px rgba(15, 23, 42, 0.14)',
  primary: '0 12px 30px rgba(14, 165, 233, 0.22)',
  warning: '0 12px 30px rgba(245, 158, 11, 0.22)',
} as const;

export const animation = {
  duration: {
    fast: '120ms',
    normal: '180ms',
    slow: '260ms',
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    spring: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    linear: 'linear',
  },
} as const;

export const componentSizes = {
  button: {
    sm: { height: 36, fontSize: typography.fontSize.sm, paddingH: spacing[4] },
    md: { height: 48, fontSize: typography.fontSize.base, paddingH: spacing[6] },
    lg: { height: 56, fontSize: typography.fontSize.md, paddingH: spacing[8] },
  },
  input: {
    sm: { height: 36, fontSize: typography.fontSize.sm },
    md: { height: 48, fontSize: typography.fontSize.base },
    lg: { height: 56, fontSize: typography.fontSize.md },
  },
  avatar: {
    xs: { size: 24, fontSize: typography.fontSize.xs },
    sm: { size: 32, fontSize: typography.fontSize.sm },
    md: { size: 40, fontSize: typography.fontSize.base },
    lg: { size: 48, fontSize: typography.fontSize.md },
    xl: { size: 64, fontSize: typography.fontSize.lg },
    '2xl': { size: 80, fontSize: typography.fontSize.xl },
  },
} as const;

const theme = {
  colors,
  Colors,
  Fonts,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  animation,
  componentSizes,
};

export default theme;