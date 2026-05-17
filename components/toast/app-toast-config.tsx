import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

type ToastKind = 'success' | 'error' | 'info';

const PALETTE: Record<
  ToastKind,
  { accent: string; bg: string; border: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  success: {
    accent: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: 'checkmark-circle',
  },
  error: {
    accent: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: 'alert-circle',
  },
  info: {
    accent: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: 'information-circle',
  },
};

const enterAnim = FadeInDown.springify().damping(18).stiffness(220).mass(0.85);
const exitAnim = FadeOutUp.duration(240);

function ToastCard({
  kind,
  text1,
  text2,
}: {
  kind: ToastKind;
  text1?: string;
  text2?: string;
}) {
  const p = PALETTE[kind];
  return (
    <Animated.View
      entering={enterAnim}
      exiting={exitAnim}
      style={[styles.card, { backgroundColor: p.bg, borderColor: p.border, borderLeftColor: p.accent }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${p.accent}18` }]}>
        <Ionicons name={p.icon} size={22} color={p.accent} />
      </View>
      <View style={styles.textCol}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </Animated.View>
  );
}

function render(kind: ToastKind) {
  return function AppToast({ text1, text2 }: ToastConfigParams<unknown>) {
    return <ToastCard kind={kind} text1={text1} text2={text2} />;
  };
}

export const appToastConfig: ToastConfig = {
  success: render('success'),
  error: render('error'),
  info: render('info'),
};

export const appToastProps = {
  topOffset: Platform.OS === 'ios' ? 56 : 48,
  visibilityTime: 4200,
  autoHide: true,
};

const styles = StyleSheet.create({
  card: {
    width: '92%',
    maxWidth: 400,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#0A1929',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textCol: { flex: 1, gap: 4 },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D1B3E',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5C6B8C',
    lineHeight: 18,
  },
});
