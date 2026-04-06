// ============================================================
// Campus Ride — Componentes Base Reutilizáveis
// components.tsx · v1.0 · Sprint 1
// ============================================================

import React, { useState, forwardRef } from 'react';
import {
  Pressable as RNPressable,
  StyleSheet as RNStyleSheet,
  Text as RNText,
  View as RNView,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import theme, {
  colors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  animation,
  componentSizes,
} from '@/constants/theme';

// ─── TYPES ───────────────────────────────────────────────────

type ButtonVariant  = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'warning' | 'danger';
type ButtonSize     = 'sm' | 'md' | 'lg';
type InputSize      = 'sm' | 'md' | 'lg';
type AvatarSize     = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type SpinnerSize    = 'xs' | 'sm' | 'md' | 'lg';
type CardVariant    = 'default' | 'elevated' | 'outlined' | 'filled';

// ─────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  fullWidth?: boolean;
  loading?:  boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
  children:  React.ReactNode;
}

const buttonStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.primary[500],
    color:           colors.text.inverse,
    border:          'none',
    boxShadow:       shadows.primary,
  },
  secondary: {
    backgroundColor: colors.secondary[500],
    color:           colors.text.inverse,
    border:          'none',
    boxShadow:       shadows.sm,
  },
  outlined: {
    backgroundColor: 'transparent',
    color:           colors.primary[500],
    border:          `${borderWidth.sm} solid ${colors.primary[500]}`,
    boxShadow:       'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color:           colors.primary[500],
    border:          'none',
    boxShadow:       'none',
  },
  warning: {
    backgroundColor: colors.warning[500],
    color:           colors.text.inverse,
    border:          'none',
    boxShadow:       shadows.warning,
  },
  danger: {
    backgroundColor: colors.error[500],
    color:           colors.text.inverse,
    border:          'none',
    boxShadow:       shadows.sm,
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant  = 'primary',
  size     = 'md',
  fullWidth = false,
  loading  = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...rest
}, ref) => {
  const sizeConfig = componentSizes.button[size];
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[2],
    height:         sizeConfig.height,
    paddingLeft:    sizeConfig.paddingH,
    paddingRight:   sizeConfig.paddingH,
    width:          fullWidth ? '100%' : 'auto',
    fontFamily:     typography.fontFamily.body,
    fontSize:       sizeConfig.fontSize,
    fontWeight:     typography.fontWeight.semiBold,
    letterSpacing:  typography.letterSpacing.wide,
    borderRadius:   borderRadius.md,
    cursor:         isDisabled ? 'not-allowed' : 'pointer',
    opacity:        isDisabled ? 0.5 : 1,
    transition:     `all ${animation.duration.fast} ${animation.easing.easeInOut}`,
    userSelect:     'none',
    whiteSpace:     'nowrap',
    textDecoration: 'none',
    ...buttonStyles[variant],
    ...style,
  };

  return (
    <button ref={ref} disabled={isDisabled} style={baseStyle} {...rest}>
      {loading ? (
        <LoadingSpinner size="xs" color="currentColor" />
      ) : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});
Button.displayName = 'Button';

// ─────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?:       string;
  hint?:        string;
  error?:       string;
  success?:     string;
  size?:        InputSize;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  fullWidth?:   boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  success,
  size      = 'md',
  leftIcon,
  rightIcon,
  fullWidth = true,
  disabled,
  style,
  ...rest
}, ref) => {
  const [focused, setFocused] = useState(false);
  const sizeConfig = componentSizes.input[size];

  const hasError   = Boolean(error);
  const hasSuccess = Boolean(success);

  const borderColor = hasError
    ? colors.border.error
    : hasSuccess
      ? colors.border.success
      : focused
        ? colors.border.focus
        : colors.border.default;

  const wrapperStyle: React.CSSProperties = {
    display:       'flex',
    flexDirection: 'column',
    gap:           spacing[1],
    width:         fullWidth ? '100%' : 'auto',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily:  typography.fontFamily.body,
    fontSize:    typography.fontSize.sm,
    fontWeight:  typography.fontWeight.semiBold,
    color:       hasError ? colors.error[600] : colors.text.primary,
    letterSpacing: typography.letterSpacing.wide,
  };

  const inputWrapperStyle: React.CSSProperties = {
    position:        'relative',
    display:         'flex',
    alignItems:      'center',
    height:          sizeConfig.height,
    backgroundColor: disabled ? colors.neutral[100] : colors.background.surface,
    border:          `${borderWidth.xs} solid ${borderColor}`,
    borderRadius:    borderRadius.sm,
    transition:      `border-color ${animation.duration.fast} ${animation.easing.easeInOut},
                      box-shadow    ${animation.duration.fast} ${animation.easing.easeInOut}`,
    boxShadow:       focused ? `0 0 0 3px ${
      hasError ? 'rgba(240,124,37,0.15)' : 'rgba(39,99,248,0.15)'
    }` : 'none',
    overflow:        'hidden',
  };

  const inputStyle: React.CSSProperties = {
    flex:        1,
    height:      '100%',
    border:      'none',
    outline:     'none',
    background:  'transparent',
    fontFamily:  typography.fontFamily.body,
    fontSize:    sizeConfig.fontSize,
    fontWeight:  typography.fontWeight.regular,
    color:       colors.text.primary,
    paddingLeft: leftIcon  ? spacing[10] : spacing[3],
    paddingRight: rightIcon ? spacing[10] : spacing[3],
    cursor:      disabled ? 'not-allowed' : 'text',
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    position:   'absolute',
    display:    'flex',
    alignItems: 'center',
    color:      colors.text.tertiary,
    pointerEvents: 'none',
  };

  const hintStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily.body,
    fontSize:   typography.fontSize.xs,
    color:      hasError
      ? colors.error[500]
      : hasSuccess
        ? colors.success[600]
        : colors.text.tertiary,
  };

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}

      <div style={inputWrapperStyle}>
        {leftIcon && (
          <span style={{ ...iconStyle, left: spacing[3] }}>
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          disabled={disabled}
          onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
          onBlur ={(e) => { setFocused(false); rest.onBlur?.(e);  }}
          style={inputStyle}
          {...rest}
        />

        {rightIcon && (
          <span style={{ ...iconStyle, right: spacing[3] }}>
            {rightIcon}
          </span>
        )}
      </div>

      {(hint || error || success) && (
        <span style={hintStyle}>
          {error ?? success ?? hint}
        </span>
      )}
    </div>
  );
});
Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────

interface AvatarProps {
  src?:     string;
  alt?:     string;
  name?:    string; // Usado para gerar as iniciais quando não há imagem
  size?:    AvatarSize;
  online?:  boolean; // Indicador de status online
  rating?:  number;  // Opcional — exibe badge de avaliação
  style?:   React.CSSProperties;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');
}

// Cores para avatares sem imagem — baseadas no nome
const avatarColors = [
  colors.primary[500],
  colors.secondary[600],
  colors.success[600],
  colors.warning[600],
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  online,
  rating,
  style,
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = componentSizes.avatar[size];
  const px = parseInt(sizeConfig.size);

  const containerStyle: React.CSSProperties = {
    position:      'relative',
    display:       'inline-flex',
    alignItems:    'center',
    justifyContent:'center',
    width:         sizeConfig.size,
    height:        sizeConfig.size,
    borderRadius:  borderRadius.full,
    overflow:      'hidden',
    flexShrink:    0,
    backgroundColor: getAvatarColor(name),
    ...style,
  };

  const imgStyle: React.CSSProperties = {
    width:      '100%',
    height:     '100%',
    objectFit:  'cover',
    borderRadius: borderRadius.full,
  };

  const initialsStyle: React.CSSProperties = {
    fontFamily:  typography.fontFamily.display,
    fontSize:    sizeConfig.fontSize,
    fontWeight:  typography.fontWeight.semiBold,
    color:       colors.text.inverse,
    lineHeight:  '1',
    userSelect:  'none',
  };

  const onlineDotSize = Math.max(px * 0.25, 8);
  const onlineDotStyle: React.CSSProperties = {
    position:        'absolute',
    bottom:          '0',
    right:           '0',
    width:           `${onlineDotSize}px`,
    height:          `${onlineDotSize}px`,
    borderRadius:    borderRadius.full,
    backgroundColor: colors.success[500],
    border:          `2px solid ${colors.background.surface}`,
  };

  const ratingBadgeStyle: React.CSSProperties = {
    position:        'absolute',
    bottom:          '-4px',
    left:            '50%',
    transform:       'translateX(-50%)',
    backgroundColor: colors.warning[500],
    color:           colors.text.inverse,
    fontSize:        typography.fontSize.xs,
    fontFamily:      typography.fontFamily.body,
    fontWeight:      typography.fontWeight.bold,
    padding:         `1px ${spacing[1]}`,
    borderRadius:    borderRadius.full,
    whiteSpace:      'nowrap',
    boxShadow:       `0 1px 4px rgba(0,0,0,0.2)`,
    lineHeight:      '1.4',
  };

  return (
    <div style={containerStyle}>
      {src && !imgError ? (
        <img
          src={src}
          alt={alt ?? name}
          style={imgStyle}
          onError={() => setImgError(true)}
        />
      ) : (
        <span style={initialsStyle}>
          {getInitials(name) || '?'}
        </span>
      )}

      {online && <span style={onlineDotStyle} />}

      {rating !== undefined && (
        <span style={ratingBadgeStyle}>★ {rating.toFixed(1)}</span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// LOADING SPINNER
// ─────────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  size?:    SpinnerSize;
  color?:   string;
  label?:   string; // Texto de acessibilidade
  style?:   React.CSSProperties;
}

const spinnerSizes: Record<SpinnerSize, number> = {
  xs: 14,
  sm: 20,
  md: 32,
  lg: 48,
};

// Injetamos o CSS de animação apenas uma vez
let spinnerCSSInjected = false;
function ensureSpinnerCSS() {
  if (spinnerCSSInjected) return;
  spinnerCSSInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes cr-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size  = 'md',
  color = colors.primary[500],
  label = 'Carregando...',
  style,
}) => {
  if (typeof document !== 'undefined') ensureSpinnerCSS();

  const px = spinnerSizes[size];
  const thickness = Math.max(2, Math.round(px / 8));

  const spinnerStyle: React.CSSProperties = {
    display:      'inline-block',
    width:        `${px}px`,
    height:       `${px}px`,
    borderRadius: borderRadius.full,
    border:       `${thickness}px solid ${color}20`,
    borderTopColor: color,
    animation:    `cr-spin ${animation.duration.slow} ${animation.easing.linear} infinite`,
    flexShrink:   0,
    ...style,
  };

  return (
    <span
      style={spinnerStyle}
      role="status"
      aria-label={label}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────

interface CardProps {
  variant?:    CardVariant;
  padding?:    keyof typeof spacing;
  radius?:     keyof typeof borderRadius;
  pressable?:  boolean; // Efeito de press para cards clicáveis
  onClick?:    () => void;
  children:    React.ReactNode;
  style?:      React.CSSProperties;
  className?:  string;
}

const cardVariantStyles: Record<CardVariant, React.CSSProperties> = {
  default: {
    backgroundColor: colors.background.surface,
    border:          `${borderWidth.xs} solid ${colors.border.default}`,
    boxShadow:       shadows.sm,
  },
  elevated: {
    backgroundColor: colors.background.surface,
    border:          'none',
    boxShadow:       shadows.md,
  },
  outlined: {
    backgroundColor: colors.background.surface,
    border:          `${borderWidth.xs} solid ${colors.border.default}`,
    boxShadow:       'none',
  },
  filled: {
    backgroundColor: colors.neutral[50],
    border:          'none',
    boxShadow:       'none',
  },
};

export const Card: React.FC<CardProps> = ({
  variant   = 'default',
  padding   = 4,
  radius    = 'lg',
  pressable = false,
  onClick,
  children,
  style,
  className,
}) => {
  const [pressed, setPressed] = useState(false);

  const isClickable = pressable || Boolean(onClick);

  const cardStyle: React.CSSProperties = {
    borderRadius:  borderRadius[radius],
    padding:       spacing[padding],
    transition:    `transform ${animation.duration.fast} ${animation.easing.spring},
                    box-shadow ${animation.duration.fast} ${animation.easing.easeOut}`,
    cursor:        isClickable ? 'pointer' : 'default',
    transform:     pressed && isClickable ? 'scale(0.98)' : 'scale(1)',
    ...cardVariantStyles[variant],
    ...style,
  };

  return (
    <div
      style={cardStyle}
      className={className}
      onClick={onClick}
      onMouseDown={() => isClickable && setPressed(true)}
      onMouseUp  ={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => isClickable && setPressed(true)}
      onTouchEnd  ={() => setPressed(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CARD VARIANTE — Ride Card (Carona)
// Componente específico do domínio construído sobre Card
// ─────────────────────────────────────────────────────────────

interface RideCardProps {
  driverName:   string;
  driverAvatar?: string;
  driverRating:  number;
  from:          string;
  to:            string;
  time:          string;
  seats:         number;
  price?:        number;
  onClick?:      () => void;
}

export const RideCard: React.FC<RideCardProps> = ({
  driverName,
  driverAvatar,
  driverRating,
  from,
  to,
  time,
  seats,
  price,
  onClick,
}) => {
  const cardInnerStyle: React.CSSProperties = {
    display:        'flex',
    flexDirection:  'column',
    gap:            spacing[3],
  };

  const rowStyle: React.CSSProperties = {
    display:     'flex',
    alignItems:  'center',
    gap:         spacing[3],
  };

  const routeStyle: React.CSSProperties = {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           spacing[1],
  };

  const routeTextStyle: React.CSSProperties = {
    fontFamily:  typography.fontFamily.body,
    fontSize:    typography.fontSize.sm,
    fontWeight:  typography.fontWeight.semiBold,
    color:       colors.text.primary,
  };

  const routeSubStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily.body,
    fontSize:   typography.fontSize.xs,
    color:      colors.text.tertiary,
  };

  const dividerStyle: React.CSSProperties = {
    height:          '1px',
    backgroundColor: colors.border.default,
  };

  const metaRowStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  };

  const metaChipStyle: React.CSSProperties = {
    display:         'flex',
    alignItems:      'center',
    gap:             spacing[1],
    backgroundColor: colors.primary[50],
    color:           colors.primary[700],
    fontFamily:      typography.fontFamily.body,
    fontSize:        typography.fontSize.xs,
    fontWeight:      typography.fontWeight.semiBold,
    padding:         `${spacing[0.5]} ${spacing[2]}`,
    borderRadius:    borderRadius.full,
  };

  const priceStyle: React.CSSProperties = {
    fontFamily:  typography.fontFamily.display,
    fontSize:    typography.fontSize.md,
    fontWeight:  typography.fontWeight.bold,
    color:       colors.primary[500],
  };

  return (
    <Card variant="elevated" pressable onClick={onClick}>
      <div style={cardInnerStyle}>
        {/* Driver row */}
        <div style={rowStyle}>
          <Avatar
            src={driverAvatar}
            name={driverName}
            size="md"
            rating={driverRating}
          />
          <div>
            <p style={{ ...routeTextStyle, marginBottom: '2px' }}>{driverName}</p>
            <p style={routeSubStyle}>★ {driverRating.toFixed(1)}</p>
          </div>
        </div>

        <div style={dividerStyle} />

        {/* Route row */}
        <div style={rowStyle}>
          {/* Ícone visual de rota */}
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '3px',
          }}>
            <span style={{
              width: '10px', height: '10px',
              borderRadius: '50%',
              backgroundColor: colors.primary[500],
            }} />
            <span style={{
              width: '2px', height: '24px',
              backgroundColor: colors.neutral[200],
            }} />
            <span style={{
              width: '10px', height: '10px',
              borderRadius: '50%',
              backgroundColor: colors.secondary[500],
            }} />
          </div>

          <div style={routeStyle}>
            <span style={routeTextStyle}>{from}</span>
            <span style={routeSubStyle}>{time}</span>
            <span style={{ ...routeTextStyle, marginTop: spacing[1] }}>{to}</span>
          </div>
        </div>

        <div style={dividerStyle} />

        {/* Meta row */}
        <div style={metaRowStyle}>
          <span style={metaChipStyle}>
            {seats} {seats === 1 ? 'vaga' : 'vagas'}
          </span>
          {price !== undefined && (
            <span style={priceStyle}>
              {price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// REUSABLE PRIMITIVES — React Native
// ─────────────────────────────────────────────────────────────

type NativeSurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function NativeSurfaceCard({ children, style }: NativeSurfaceCardProps) {
  return <RNView style={[nativeProfileStyles.card, style]}>{children}</RNView>;
}

type NativeInfoRowProps = {
  label: string;
  value: string;
};

export function NativeInfoRow({ label, value }: NativeInfoRowProps) {
  return (
    <RNView style={nativeProfileStyles.row}>
      <RNText style={nativeProfileStyles.rowLabel}>{label}</RNText>
      <RNText style={nativeProfileStyles.rowValue}>{value}</RNText>
    </RNView>
  );
}

type NativeActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function NativeActionButton({
  label,
  onPress,
  variant = 'primary',
  style,
  textStyle,
}: NativeActionButtonProps) {
  return (
    <RNPressable
      style={({ pressed }) => [
        nativeProfileStyles.button,
        variant === 'danger' ? nativeProfileStyles.buttonDanger : nativeProfileStyles.buttonPrimary,
        pressed && nativeProfileStyles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <RNText style={[nativeProfileStyles.buttonText, textStyle]}>{label}</RNText>
    </RNPressable>
  );
}

const nativeProfileStyles = RNStyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: colors.primary[500],
  },
  buttonDanger: {
    backgroundColor: colors.error[500],
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────────────────────
// RE-EXPORTS
// ─────────────────────────────────────────────────────────────

export { theme, colors, typography, spacing, borderRadius, shadows, animation };
