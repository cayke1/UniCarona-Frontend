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
import { PrimaryButton } from '@/components/auth/primary-button';
import { AUTH_MAX_CONTENT_WIDTH, CampusRideColors } from '@/constants/campus-ride-theme';
import { ApiError, authApi } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe seu email universitário.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Não foi possível enviar. Verifique sua conexão.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {sent ? (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="mail-open-outline" size={48} color={CampusRideColors.primary} />
                </View>
                <Text style={styles.title}>Verifique seu email</Text>
                <Text style={styles.lead}>
                  Enviamos um link de redefinição para{' '}
                  <Text style={styles.emailHighlight}>{email.trim()}</Text>. Abra o email e clique no
                  link para criar uma nova senha.
                </Text>
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={CampusRideColors.primary}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.infoText}>
                    O link expira em 5 minutos. Não esqueça de checar a pasta de spam.
                  </Text>
                </View>
                <PrimaryButton
                  label="Reenviar email"
                  onPress={() => {
                    setSent(false);
                    void onSubmit();
                  }}
                  loading={loading}
                />
                <Pressable style={styles.back} onPress={() => router.back()}>
                  <Text style={styles.link}>Voltar ao login</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.title}>Recuperar senha</Text>
                <Text style={styles.lead}>
                  Digite o email da sua conta para receber o link de redefinição de senha.
                </Text>
                <AuthTextField
                  icon="mail-outline"
                  placeholder="Email universitário"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <PrimaryButton label="Enviar" onPress={onSubmit} loading={loading} />
                <Pressable style={styles.back} onPress={() => router.back()}>
                  <Text style={styles.link}>Voltar ao login</Text>
                </Pressable>
              </>
            )}
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: CampusRideColors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: CampusRideColors.text,
    marginBottom: 4,
  },
  lead: {
    fontSize: 15,
    color: CampusRideColors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  emailHighlight: {
    color: CampusRideColors.text,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: CampusRideColors.infoBg,
    borderWidth: 1,
    borderColor: CampusRideColors.infoBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: CampusRideColors.primary,
    lineHeight: 20,
  },
  back: {
    alignItems: 'center',
  },
  link: {
    color: CampusRideColors.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
