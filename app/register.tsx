import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { AUTH_MAX_CONTENT_WIDTH, CampusRideColors } from '@/constants/campus-ride-theme';
import { LEGAL_URLS } from '@/constants/legal-urls';
import { ApiError, authApi, extractTokenFromAuthResponse } from '@/lib/api';
import { saveAuthToken } from '@/lib/auth-token';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirm, setShowConfirm] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha nome, email e senha.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Atenção', 'Aceite os termos para continuar.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      const token = extractTokenFromAuthResponse(data);
      if (token) await saveAuthToken(token);
      Alert.alert('Conta criada', 'Bem-vindo ao Campus Ride!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Não foi possível criar a conta.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Junte-se à comunidade Campus Ride e viaje com segurança.
          </Text>

          <View style={styles.form}>
            <AuthTextField
              icon="person-outline"
              placeholder="Nome completo"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <AuthTextField
              icon="mail-outline"
              placeholder="Email universitário"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AuthTextField
              icon="lock-closed-outline"
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={showPassword}
              onToggleSecure={() => setShowPassword(!showPassword)}
            />
            <AuthTextField
              icon="lock-closed-outline"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={showConfirm}
              onToggleSecure={() => setShowConfirm(!showConfirm)}
            />

            <View style={styles.termsRow}>
              <Pressable
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                style={styles.checkboxHit}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}>
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn]}>
                  {acceptedTerms ? (
                    <Ionicons name="checkmark" size={16} color={CampusRideColors.white} />
                  ) : null}
                </View>
              </Pressable>
              <Text style={styles.termsText}>
                Li e aceito os{' '}
                <Text
                  style={styles.inlineLink}
                  onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
                  Termos de Uso
                </Text>{' '}
                e a{' '}
                <Text
                  style={styles.inlineLink}
                  onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
                  Política de Privacidade
                </Text>
              </Text>
            </View>

            <PrimaryButton
              label="Criar conta"
              onPress={onRegister}
              loading={loading}
              disabled={!acceptedTerms}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={22} color={CampusRideColors.primary} />
            <Text style={styles.infoText}>
              Verificamos o email institucional para garantir a segurança da comunidade.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.linkBold}>Entrar</Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CampusRideColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: CampusRideColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: CampusRideColors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  form: {
    gap: 14,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  checkboxHit: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: CampusRideColors.border,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CampusRideColors.white,
  },
  checkboxOn: {
    backgroundColor: CampusRideColors.primary,
    borderColor: CampusRideColors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: CampusRideColors.textSecondary,
    lineHeight: 20,
  },
  inlineLink: {
    color: CampusRideColors.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: CampusRideColors.infoBg,
    borderWidth: 1,
    borderColor: CampusRideColors.infoBorder,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: CampusRideColors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: CampusRideColors.textSecondary,
  },
  linkBold: {
    fontSize: 15,
    fontWeight: '600',
    color: CampusRideColors.primary,
  },
});
