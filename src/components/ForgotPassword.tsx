import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AuthBandEntrance, AuthFooterEntrance } from '@/src/components/auth-screen-motion';

const MAX_WIDTH = 420;
const BLACK_BAND_SIDE = 56;
const BLACK_TOP_RATIO = 0.15;

type Props = {
  children?: ReactNode;
  footer?: ReactNode;
};

/**
 * Layout da tela de recuperação de senha no mesmo padrão visual do fluxo de autenticação.
 */
export function ForgotPassword({ children, footer }: Props) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(MAX_WIDTH, width - 32);
  const blackBandHeight = height * BLACK_TOP_RATIO;
  const contentPaddingTop = height * (BLACK_TOP_RATIO - 0.02);
  const footerReserve = footer ? 68 + insets.bottom : 16;
  const titleBandTop = insets.top;
  const titleBandHeight = Math.max(0, blackBandHeight - insets.top);

  return (
    <View style={styles.flex}>
      <View pointerEvents="none" style={styles.bg}>
        <View style={styles.bgTop} />
        <View style={styles.bgBottom} />
      </View>

      <AuthBandEntrance
        style={[
          styles.blackBandRow,
          {
            top: titleBandTop,
            height: titleBandHeight,
          },
        ]}>
        <View style={[styles.blackBandSide, { width: BLACK_BAND_SIDE }]}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/login');
            }}
            style={({ pressed }) => [styles.backButtonInner, pressed && styles.backButtonPressed]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Voltar">
            <FontAwesome
              name="chevron-left"
              size={20}
              color="#ffffff"
              style={styles.backIconOptical}
            />
          </Pressable>
        </View>
        <View style={styles.blackBandTitle} pointerEvents="none">
          <ThemedText
            lightColor="#ffffff"
            darkColor="#ffffff"
            style={styles.screenTitle}
            selectable={false}>
            Recuperar senha
          </ThemedText>
        </View>
        <View style={[styles.blackBandSide, { width: BLACK_BAND_SIDE }]} pointerEvents="none" />
      </AuthBandEntrance>

      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.shell}>
            <KeyboardAvoidingView
              style={styles.kavContent}
              behavior={Platform.select({ ios: 'padding', android: undefined })}
              keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}>
              <View
                style={[
                  styles.whiteContent,
                  styles.scroll,
                  {
                    paddingTop: contentPaddingTop,
                    paddingBottom: footerReserve + (footer ? 8 : 0),
                  },
                ]}>
                <View style={[styles.column, { maxWidth: contentWidth }]}> 
                  <View style={styles.form}>{children}</View>
                </View>
              </View>
            </KeyboardAvoidingView>

            {footer ? (
              <AuthFooterEntrance
                style={[
                  styles.footer,
                  styles.footerFixed,
                  {
                    maxWidth: contentWidth,
                    width: '100%',
                    alignSelf: 'center',
                    paddingTop: 12,
                    paddingBottom: 12 + Math.max(insets.bottom, 8),
                  },
                ]}
                pointerEvents="box-none">
                {footer}
              </AuthFooterEntrance>
            ) : null}
          </View>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  kavContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  whiteContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  blackBandRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  blackBandSide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackBandTitle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  backButtonInner: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconOptical: {
    transform: [{ translateY: 3 }],
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  bgTop: {
    height: '15%',
    backgroundColor: '#0b0b0d',
  },
  bgBottom: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  column: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  form: {
    gap: 16,
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
