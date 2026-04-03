import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { GoogleLogo } from '@/components/auth/google-logo';
import { PrimaryButton } from '@/components/auth/primary-button';
import { AUTH_MAX_CONTENT_WIDTH, CampusRideColors } from '@/constants/campus-ride-theme';
import { ApiError, authApi, extractTokenFromAuthResponse } from '@/lib/api';
import { saveAuthToken } from '@/lib/auth-token';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      const token = extractTokenFromAuthResponse(data);
      if (token) await saveAuthToken(token);
      router.replace('/(tabs)');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  function onGoogle() {
    Alert.alert(
      'Entrar com Google',
      'Conecte aqui o fluxo OAuth do seu backend (ex.: expo-auth-session + endpoint do servidor).'
    );
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
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="car-sport" size={40} color={CampusRideColors.primary} />
            </View>
            <Text style={styles.brand}>Campus Ride</Text>
            <Text style={styles.subtitle}>
            Conecte-se com estudantes da sua universidade e divida trajetos com segurança e economia.
            </Text>
          </View>

          <View style={styles.form}>
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

            <Pressable style={styles.forgotWrap} onPress={() => router.push('/forgot-password')}>
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>

            <PrimaryButton label="Entrar" onPress={onLogin} loading={loading} />
          </View>

          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>ou</Text>
            <View style={styles.sepLine} />
          </View>

          <Pressable style={styles.googleBtn} onPress={onGoogle}>
            <GoogleLogo size={22} />
            <Text style={styles.googleLabel}>Entrar com Google</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={styles.linkBold}>Criar conta</Text>
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
  logoBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: CampusRideColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: CampusRideColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: CampusRideColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  form: {
    gap: 14,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -4,
  },
  link: {
    color: CampusRideColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  sepLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: CampusRideColors.border,
  },
  sepText: {
    color: CampusRideColors.textSecondary,
    fontSize: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: CampusRideColors.white,
    borderWidth: 1,
    borderColor: CampusRideColors.border,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 52,
  },
  googleLabel: {
    fontSize: 16,
    color: CampusRideColors.text,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    flexWrap: 'wrap',
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
