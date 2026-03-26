import { type ReactNode } from 'react';
import { type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const STAGGER_MS = 52;
const BASE_MS = 40;

type StaggerProps = {
  step: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Entrada em leque: desce + opacidade, com atraso por etapa */
export function StaggerFadeIn({ step, children, style }: StaggerProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(BASE_MS + step * STAGGER_MS)}
      style={style}>
      {children}
    </Animated.View>
  );
}

/** Logo no login — mesmo tipo de entrada suave da faixa “Criar conta” (só opacidade) */
export function AuthLogoEntrance({ children, style, ...rest }: ViewProps) {
  return (
    <Animated.View entering={FadeIn.duration(380)} style={style} {...rest}>
      {children}
    </Animated.View>
  );
}

/** Faixa preta (register) */
export function AuthBandEntrance({ children, style, ...rest }: ViewProps) {
  return (
    <Animated.View entering={FadeIn.duration(380)} style={style} {...rest}>
      {children}
    </Animated.View>
  );
}

/** Rodapé fixo */
export function AuthFooterEntrance({ children, style, ...rest }: ViewProps) {
  return (
    <Animated.View entering={FadeIn.duration(450).delay(220)} style={style} {...rest}>
      {children}
    </Animated.View>
  );
}
