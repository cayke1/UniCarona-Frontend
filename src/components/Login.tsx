import { type ReactNode, useState } from 'react';
import {
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {
  AuthFooterEntrance,
  AuthLogoEntrance,
  StaggerFadeIn,
} from '@/src/components/auth-screen-motion';

const MAX_WIDTH = 420;

type Props = {
  /** Conteúdo do formulário (campos, botão principal, erros) */
  children?: ReactNode;
  /** Link ou texto secundário (ex.: ir para cadastro) */
  footer?: ReactNode;
};

/**
 * Estrutura base da tela de login: safe area, teclado, scroll e coluna com largura máxima.
 * Coloque validação, estado e chamadas à API nos filhos ou em hooks neste arquivo.
 */
export function Login({ children, footer }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(MAX_WIDTH, width - 32);
  /** Menor espaço entre a faixa preta e o título “Entrar” (abaixo de 25% da altura) */
  const contentPaddingTop = height * 0.23 + 0;
  /** Espaço reservado para o rodapé fixo não ser coberto pelo formulário */
  /** Altura aproximada do rodapé (texto + padding simétrico + safe area) */
  const footerReserve = footer ? 68 + insets.bottom : 16;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.flex}>
      {/* Fundo: 25% preto em cima + 75% branco embaixo */}
      <View pointerEvents="none" style={styles.bg}>
        <View style={styles.bgTop} />
        <View style={styles.bgBottom} />
      </View>
      {/* Logo centralizada na área preta */}
      <AuthLogoEntrance pointerEvents="none" style={styles.logoWrap}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityRole="image"
          accessibilityLabel="UniCarona"
        />
      </AuthLogoEntrance>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <Pressable
          style={styles.flex}
          onPress={Keyboard.dismiss}
          accessible={false}>
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
                <StaggerFadeIn step={0} style={styles.header}>
                  <ThemedText
                    lightColor="#0b0b0d"
                    darkColor="#0b0b0d"
                    style={styles.screenTitle}
                    selectable={false}>
                    Entrar
                  </ThemedText>
                </StaggerFadeIn>

                <View style={styles.form}>
                  <StaggerFadeIn step={1} style={styles.field}>
                    <ThemedText
                      lightColor="#0b0b0d"
                      darkColor="#0b0b0d"
                      style={styles.label}
                      selectable={false}>
                      E-mail
                    </ThemedText>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="seu@email.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      style={styles.input}
                    />
                  </StaggerFadeIn>

                  <StaggerFadeIn step={2} style={styles.field}>
                    <ThemedText
                      lightColor="#0b0b0d"
                      darkColor="#0b0b0d"
                      style={styles.label}
                      selectable={false}>
                      Senha
                    </ThemedText>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password"
                      textContentType="password"
                      style={styles.input}
                    />
                  </StaggerFadeIn>

                  <StaggerFadeIn step={3} style={styles.forgotRow}>
                    <Link href="/forgot-password" asChild>
                      <Pressable hitSlop={8} style={styles.forgotHit}>
                        <ThemedText
                          lightColor="#64748b"
                          darkColor="#94a3b8"
                          style={styles.forgotText}
                          selectable={false}>
                          Esqueceu a senha?
                        </ThemedText>
                      </Pressable>
                    </Link>
                  </StaggerFadeIn>

                  <StaggerFadeIn step={4}>
                    <Pressable
                      style={({ pressed }) => [styles.entrarButton, pressed && styles.entrarButtonPressed]}
                      onPress={() => {
                        // TODO: enviar login (email, password)
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Entrar">
                      <Text style={styles.entrarButtonText}>Entrar</Text>
                    </Pressable>
                  </StaggerFadeIn>

                  <StaggerFadeIn step={5} style={styles.socialSection}>
                    <ThemedText
                      lightColor="#94a3b8"
                      darkColor="#94a3b8"
                      style={styles.socialLabel}
                      selectable={false}>
                      ou faça login com
                    </ThemedText>
                    <View style={styles.socialRow}>
                      <Pressable style={styles.socialButton}>
                        <FontAwesome name="google" size={20} color="#DB4437" />
                      </Pressable>
                      <Pressable style={styles.socialButton}>
                        <FontAwesome name="facebook" size={20} color="#1877F2" />
                      </Pressable>
                    </View>
                  </StaggerFadeIn>

                  {children}
                </View>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  bgTop: {
    height: '25%',
    backgroundColor: '#0b0b0d',
  },
  bgBottom: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 80,
  },
  logoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 170,
    height: 70,
    maxWidth: '85%',
  },
  column: {
    width: '100%',
  },
  header: {
    marginBottom: 32,
    gap: 8,
    width: '100%',
    alignItems: 'center',
  },
  screenTitle: {
    textAlign: 'center',
    width: '100%',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  form: {
    gap: 16,
    width: '100%',
  },
  field: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0b0b0d',
    backgroundColor: '#ffffff',
  },
  forgotRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  forgotHit: {
    flexShrink: 0,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  entrarButton: {
    width: '100%',
    minHeight: 48,
    marginTop: 18,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: '#0b0b0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrarButtonPressed: {
    opacity: 0.88,
  },
  entrarButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialSection: {
    marginTop: 12,
    alignItems: 'center',
    gap: 10,
  },
  socialLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  socialButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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
