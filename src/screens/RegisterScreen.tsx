import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { StaggerFadeIn } from '@/src/components/auth-screen-motion';
import { Register } from '@/src/components/Register';

/**
 * Rota: /register — mesmo estilo visual do Login (15% preto / 85% branco).
 */
export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <Register
      footer={
        <Link href="/login" asChild>
          <Pressable style={styles.footerLink} accessibilityRole="link">
            <ThemedText style={styles.footerText}>
              <ThemedText
                lightColor="#0b0b0d"
                darkColor="#0b0b0d"
                style={{ fontWeight: '500', fontSize: 15 }}>
                Já tem conta?{' '}
              </ThemedText>
              <ThemedText lightColor="#DB4437" darkColor="#DB4437" style={{ fontWeight: '700', fontSize: 16 }}>
                Entrar
              </ThemedText>
            </ThemedText>
          </Pressable>
        </Link>
      }>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <StaggerFadeIn step={0} style={styles.field}>
          <ThemedText
            lightColor="#0b0b0d"
            darkColor="#0b0b0d"
            style={styles.label}
            selectable={false}>
            Nome completo
          </ThemedText>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Seu nome completo"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            style={styles.input}
          />
        </StaggerFadeIn>

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
            autoComplete="password-new"
            textContentType="newPassword"
            style={styles.input}
          />
        </StaggerFadeIn>

        <StaggerFadeIn step={3} style={styles.field}>
          <ThemedText
            lightColor="#0b0b0d"
            darkColor="#0b0b0d"
            style={styles.label}
            selectable={false}>
            Confirmação de senha
          </ThemedText>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            style={styles.input}
          />
        </StaggerFadeIn>

        <StaggerFadeIn step={4}>
          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
            onPress={() => {
              // TODO: validar e enviar cadastro
            }}
            accessibilityRole="button"
            accessibilityLabel="Criar conta">
            <Text style={styles.submitButtonText}>Criar conta</Text>
          </Pressable>
        </StaggerFadeIn>

        <StaggerFadeIn step={5} style={styles.socialSection}>
          <ThemedText
            lightColor="#94a3b8"
            darkColor="#94a3b8"
            style={styles.socialLabel}
            selectable={false}>
            ou cadastre-se com
          </ThemedText>
          <View style={styles.socialRow}>
            <Pressable
              style={styles.socialButton}
              onPress={() => {
                // TODO: cadastro com Google
              }}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar com Google">
              <FontAwesome name="google" size={20} color="#DB4437" />
            </Pressable>
            <Pressable
              style={styles.socialButton}
              onPress={() => {
                // TODO: cadastro com Facebook
              }}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar com Facebook">
              <FontAwesome name="facebook" size={20} color="#1877F2" />
            </Pressable>
          </View>
        </StaggerFadeIn>
      </ScrollView>
    </Register>
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
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
    gap: 16,
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
    marginTop: 14,
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
});
