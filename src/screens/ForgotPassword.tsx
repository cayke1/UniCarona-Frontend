import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StaggerFadeIn } from '@/src/components/auth-screen-motion';
import { ForgotPassword } from '@/src/components/ForgotPassword';

/**
 * Rota: /forgot-password — mesma linguagem visual de login/cadastro.
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  return (
    <ForgotPassword
      footer={
        <Link href="/login" asChild>
          <Pressable style={styles.footerLink} accessibilityRole="link">
            <ThemedText style={styles.footerText}>
              <ThemedText
                lightColor="#0b0b0d"
                darkColor="#0b0b0d"
                style={{ fontWeight: '500', fontSize: 15 }}>
                Lembrou sua senha?{' '}
              </ThemedText>
              <ThemedText lightColor="#DB4437" darkColor="#DB4437" style={{ fontWeight: '700', fontSize: 16 }}>
                Entrar
              </ThemedText>
            </ThemedText>
          </Pressable>
        </Link>
      }>
      <StaggerFadeIn step={0} style={styles.infoBlock}>
        <ThemedText lightColor="#0b0b0d" darkColor="#0b0b0d" style={styles.infoTitle} selectable={false}>
          Esqueceu a senha?
        </ThemedText>
        <ThemedText lightColor="#64748b" darkColor="#64748b" style={styles.infoText} selectable={false}>
          Informe seu e-mail para receber o link de redefinição.
        </ThemedText>
      </StaggerFadeIn>

      <StaggerFadeIn step={1} style={styles.field}>
        <ThemedText lightColor="#0b0b0d" darkColor="#0b0b0d" style={styles.label} selectable={false}>
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

      <StaggerFadeIn step={2}>
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          onPress={() => {
            // TODO: enviar solicitação de redefinição de senha
          }}
          accessibilityRole="button"
          accessibilityLabel="Enviar link de redefinição">
          <Text style={styles.submitButtonText}>Enviar link</Text>
        </Pressable>
      </StaggerFadeIn>

      <StaggerFadeIn step={3} style={styles.tipBox}>
        <View style={styles.tipDot} />
        <ThemedText lightColor="#64748b" darkColor="#64748b" style={styles.tipText} selectable={false}>
          Verifique também sua caixa de spam caso o e-mail não chegue em alguns minutos.
        </ThemedText>
      </StaggerFadeIn>
    </ForgotPassword>
  );
}

const styles = StyleSheet.create({
  footerLink: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    width: '100%',
    textAlign: 'center',
    alignSelf: 'center',
  },
  infoBlock: {
    width: '100%',
    gap: 6,
    marginBottom: 2,
  },
  infoTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
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
  submitButton: {
    width: '100%',
    minHeight: 48,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#0b0b0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.88,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipBox: {
    marginTop: 6,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 2,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    marginTop: 6,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
