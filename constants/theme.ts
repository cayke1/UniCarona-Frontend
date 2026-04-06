// ============================================================
// Campus Ride — Design System Tokens
// theme.ts · v1.0 · Sprint 1
// ============================================================

// ─── CORES ───────────────────────────────────────────────────

export const colors = {
  // Primárias
  primary: {
    50:  '#E8F0FE',
    100: '#C6D8FC',
    200: '#9ABFF9',
    300: '#6EA6F7',
    400: '#4D91F5',
    500: '#2763F8', // Azul Principal — Confiança & Tecnologia
    600: '#1F55D6',
    700: '#1745B0',
    800: '#0F358A',
    900: '#082566',
  },

  // Secundárias — refinado para diferenciação clara do primário
  secondary: {
    50:  '#E3F5FF',
    100: '#BAE5FF',
    200: '#8DD4FF',
    300: '#5EC2FF',
    400: '#38B4FF',
    500: '#0EA5E9', // Azul Secundário — Confirmação & Cards
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },

  // Alertas & Ações
  warning: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F1A507', // Amarelo Alerta — Alertas & Confirmação
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  error: {
    50:  '#FFF4ED',
    100: '#FFE4CF',
    200: '#FFCA9E',
    300: '#FFAA6D',
    400: '#FF8A42',
    500: '#F07C25', // Laranja Erro — Erros & Atenção
    600: '#E56215',
    700: '#C24B0C',
    800: '#9A3A09',
    900: '#7C2E08',
  },

  // Sucesso — novo token (melhoria sugerida)
  success: {
    50:  '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Verde Sucesso — Carona confirmada, avaliações positivas
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Neutros
  neutral: {
    0:   '#FFFFFF', // Branco — Fundos & Separadores
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    1000:'#020617',
  },

  // Semânticos (aliases para uso nos componentes)
  background: {
    app:     '#F8FAFC', // Fundo geral do app
    surface: '#FFFFFF', // Cards, modais, inputs
    overlay: 'rgba(15, 23, 42, 0.48)', // Overlay de modal
  },

  text: {
    primary:   '#0F172A', // Títulos e textos principais
    secondary: '#475569', // Labels e textos secundários
    tertiary:  '#94A3B8', // Placeholders e hints
    inverse:   '#FFFFFF', // Texto em fundos escuros
    link:      '#2763F8', // Links e ações
  },

  border: {
    default: '#E2E8F0',
    focus:   '#2763F8',
    error:   '#F07C25',
    success: '#22C55E',
  },
} as const;

// ─── TIPOGRAFIA ───────────────────────────────────────────────

export const typography = {
  fontFamily: {
    display: "'Poppins', sans-serif", // Títulos e Destaques
    body:    "'Inter', sans-serif",   // Corpo de Texto
  },
  fontWeight: {
    regular:  '400',
    medium:   '500',
    semiBold: '600',
    bold:     '700',
  },
  // Escala 4pt — rem base 16px
  fontSize: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    md:   '1.125rem',  // 18px
    lg:   '1.25rem',   // 20px
    xl:   '1.5rem',    // 24px
    '2xl':'1.875rem',  // 30px
    '3xl':'2.25rem',   // 36px
    '4xl':'3rem',      // 48px
  },
  lineHeight: {
    tight:   '1.2',
    normal:  '1.5',
    relaxed: '1.75',
  },
  letterSpacing: {
    tight:  '-0.025em',
    normal: '0em',
    wide:   '0.025em',
    widest: '0.1em',
  },
} as const;

// Estilos de texto pré-definidos
export const textStyles = {
  h1: {
    fontFamily:    typography.fontFamily.display,
    fontSize:      typography.fontSize['3xl'],
    fontWeight:    typography.fontWeight.bold,
    lineHeight:    typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
    color:         colors.text.primary,
  },
  h2: {
    fontFamily: typography.fontFamily.display,
    fontSize:   typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    color:      colors.text.primary,
  },
  h3: {
    fontFamily: typography.fontFamily.display,
    fontSize:   typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.tight,
    color:      colors.text.primary,
  },
  h4: {
    fontFamily: typography.fontFamily.display,
    fontSize:   typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.normal,
    color:      colors.text.primary,
  },
  subtitle1: {
    fontFamily: typography.fontFamily.display,
    fontSize:   typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.normal,
    color:      colors.text.primary,
  },
  subtitle2: {
    fontFamily: typography.fontFamily.display,
    fontSize:   typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    color:      colors.text.secondary,
  },
  body1: {
    fontFamily: typography.fontFamily.body,
    fontSize:   typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
    color:      colors.text.primary,
  },
  body2: {
    fontFamily: typography.fontFamily.body,
    fontSize:   typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
    color:      colors.text.secondary,
  },
  label: {
    fontFamily:    typography.fontFamily.body,
    fontSize:      typography.fontSize.sm,
    fontWeight:    typography.fontWeight.semiBold,
    lineHeight:    typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  labelSm: {
    fontFamily:    typography.fontFamily.body,
    fontSize:      typography.fontSize.xs,
    fontWeight:    typography.fontWeight.medium,
    lineHeight:    typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  caption: {
    fontFamily: typography.fontFamily.body,
    fontSize:   typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    color:      colors.text.tertiary,
  },
} as const;

// ─── ESPAÇAMENTOS — escala 4pt ────────────────────────────────

export const spacing = {
  0:    '0px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  3.5:  '14px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  9:    '36px',
  10:   '40px',
  12:   '48px',
  14:   '56px',
  16:   '64px',
  20:   '80px',
  24:   '96px',
  32:   '128px',
} as const;

export const layout = {
  screenPaddingH: spacing[4],  // 16px — Padding horizontal padrão
  screenPaddingV: spacing[6],  // 24px — Padding vertical padrão
  sectionGap:     spacing[8],  // 32px — Espaço entre seções
  cardPadding:    spacing[4],  // 16px
  cardGap:        spacing[3],  // 12px
  inputPadding:   spacing[3],  // 12px
  buttonPaddingH: spacing[6],  // 24px
  buttonPaddingV: spacing[3],  // 12px
  avatarGap:      spacing[2],  // 8px
  listItemGap:    spacing[2],  // 8px
  listSectionGap: spacing[5],  // 20px
} as const;

// ─── BORDAS ───────────────────────────────────────────────────

export const borderRadius = {
  none:  '0px',
  xs:    '4px',
  sm:    '8px',    // Inputs, badges
  md:    '12px',   // Botões, chips
  lg:    '16px',   // Cards
  xl:    '20px',   // Cards grandes, modais
  '2xl': '24px',
  full:  '9999px', // Avatares, pills
} as const;

export const borderWidth = {
  none: '0px',
  xs:   '1px',
  sm:   '1.5px',
  md:   '2px',
} as const;

// ─── SOMBRAS ──────────────────────────────────────────────────

export const shadows = {
  none:    'none',
  xs:      '0px 1px 2px rgba(15, 23, 42, 0.06)',
  sm:      '0px 2px 8px rgba(15, 23, 42, 0.08)',
  md:      '0px 4px 16px rgba(15, 23, 42, 0.10)',
  lg:      '0px 8px 24px rgba(15, 23, 42, 0.12)',
  xl:      '0px 16px 40px rgba(15, 23, 42, 0.14)',
  primary: '0px 4px 16px rgba(39, 99, 248, 0.30)',
  warning: '0px 4px 16px rgba(241, 165, 7, 0.30)',
  success: '0px 4px 16px rgba(34, 197, 94, 0.25)',
} as const;

// ─── ANIMAÇÕES ────────────────────────────────────────────────

export const animation = {
  duration: {
    instant: '80ms',
    fast:    '150ms',
    normal:  '250ms',
    slow:    '400ms',
    slower:  '600ms',
  },
  easing: {
    linear:    'linear',
    easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
    easeOut:   'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ─── TAMANHOS DE COMPONENTES ──────────────────────────────────

export const componentSizes = {
  button: {
    sm: { height: '36px', fontSize: typography.fontSize.sm,   paddingH: spacing[4] },
    md: { height: '48px', fontSize: typography.fontSize.base, paddingH: spacing[6] },
    lg: { height: '56px', fontSize: typography.fontSize.md,   paddingH: spacing[8] },
  },
  input: {
    sm: { height: '36px', fontSize: typography.fontSize.sm   },
    md: { height: '48px', fontSize: typography.fontSize.base },
    lg: { height: '56px', fontSize: typography.fontSize.md   },
  },
  avatar: {
    xs:   { size: '24px',  fontSize: typography.fontSize.xs   },
    sm:   { size: '32px',  fontSize: typography.fontSize.sm   },
    md:   { size: '40px',  fontSize: typography.fontSize.base },
    lg:   { size: '48px',  fontSize: typography.fontSize.md   },
    xl:   { size: '64px',  fontSize: typography.fontSize.lg   },
    '2xl':{ size: '80px',  fontSize: typography.fontSize.xl   },
  },
  icon: {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '28px',
    xl: '32px',
  },
} as const;

// ─── Z-INDEX ──────────────────────────────────────────────────

export const zIndex = {
  base:     0,
  raised:   10,
  dropdown: 200,
  sticky:   300,
  overlay:  400,
  modal:    500,
  toast:    600,
  tooltip:  700,
} as const;

// ─── BREAKPOINTS ──────────────────────────────────────────────

export const breakpoints = {
  xs:   '320px',
  sm:   '375px',
  md:   '390px',
  lg:   '414px',
  xl:   '768px',
  '2xl':'1024px',
} as const;

// ─── EXPORT UNIFICADO ─────────────────────────────────────────

const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  layout,
  borderRadius,
  borderWidth,
  shadows,
  animation,
  componentSizes,
  zIndex,
  breakpoints,
} as const;

export type Theme = typeof theme;
export default theme;
