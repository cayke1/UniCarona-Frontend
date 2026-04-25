import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { useUser } from '@/contexts/user-context';
import { AUTH_MAX_CONTENT_WIDTH, CampusRideColors } from '@/constants/campus-ride-theme';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { ApiError, formatApiValidationFields, userApi, type UpdateRolePayload } from '@/lib/api';

const BRAND = CampusRideColors.primary;

type IonIcon = ComponentProps<typeof Ionicons>['name'];
type BenefitProps = { icon: IonIcon; title: string; subtitle: string };

function BenefitCard({ icon, title, subtitle }: BenefitProps) {
  return (
    <View style={styles.benefitCard}>
      <View style={styles.benefitIconWrap}>
        <Ionicons name={icon} size={20} color={BRAND} />
      </View>
      <View style={styles.benefitTextCol}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

type BulletProps = { icon: IonIcon; text: string };

function Bullet({ icon, text }: BulletProps) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons name={icon} size={18} color={colors.primary[600]} style={styles.bulletIcon} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function BecomeDriverScreen() {
  const { user, setUserFromServerResponse } = useUser();
  const [pix, setPix] = useState(user?.pixKey ?? '');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (user?.pixKey) setPix(user.pixKey);
  }, [user?.pixKey]);

  const isDriver = user?.role === 'MOTORISTA';

  const onConfirm = useCallback(async () => {
    const trimmed = pix.trim();
    const existingPix = user?.pixKey?.trim() ?? '';

    if (!termsAccepted) {
      Toast.show({
        type: 'error',
        text1: 'Aceite os termos',
        text2: 'Marque a caixa para confirmar que leu as regras para motoristas.',
      });
      return;
    }

    if (!existingPix && !trimmed) {
      Toast.show({
        type: 'error',
        text1: 'Chave PIX obrigatória',
        text2: 'Informe uma chave válida para receber repasses como motorista.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: UpdateRolePayload = { role: 'DRIVER' };
      if (!existingPix) {
        payload.pixKey = trimmed;
      } else if (trimmed && trimmed !== existingPix) {
        payload.pixKey = trimmed;
      }

      const roleRes = await userApi.patchRole(payload);
      setUserFromServerResponse(roleRes as Record<string, unknown>);
      Toast.show({
        type: 'success',
        text1: 'Você é motorista!',
        text2: 'Seu perfil foi atualizado. Você já pode publicar caronas.',
      });
      router.replace('/(tabs)/profile' as Href);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        Toast.show({
          type: 'error',
          text1: 'Chave PIX obrigatória',
          text2:
            'O servidor exige uma chave PIX para ativar o motorista (erro 422). Preencha o campo acima com CPF, e-mail, telefone ou chave aleatória válida.',
        });
        return;
      }
      const fields = e instanceof ApiError ? formatApiValidationFields(e.body) : null;
      const msg =
        fields ??
        (e instanceof ApiError ? e.message : 'Não foi possível concluir. Tente novamente.');
      Toast.show({ type: 'error', text1: 'Não foi possível ativar', text2: msg });
    } finally {
      setLoading(false);
    }
  }, [pix, termsAccepted, user?.pixKey, setUserFromServerResponse]);

  if (isDriver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.scrollHeader}>
              <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            <View style={styles.alreadyWrap}>
              <View style={styles.alreadyIconCircle}>
                <Ionicons name="checkmark-done" size={40} color={colors.success[600]} />
              </View>
              <Text style={styles.alreadyTitle}>Você já oferece caronas</Text>
              <Text style={styles.alreadySub}>
                Sua conta já tem o papel de motorista. Publique uma rota ou ajuste sua chave PIX no
                perfil, se precisar.
              </Text>
              <View style={styles.alreadyActions}>
                <View style={styles.primaryWrap}>
                  <PrimaryButton
                    label="Publicar carona"
                    onPress={() => router.replace('/publish-ride' as Href)}
                  />
                </View>
                <Pressable onPress={() => router.back()} style={styles.secondaryLink}>
                  <Text style={styles.secondaryLinkText}>Voltar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
            <View style={styles.hero}>
              <View style={styles.heroTopRow}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                </Pressable>
                <View style={styles.brandRow}>
                  <View style={styles.headerLogoCircle}>
                    <Ionicons name="car-sport" size={22} color={CampusRideColors.primary} />
                  </View>
                  <Text style={styles.brandText} numberOfLines={1}>
                    Campus Ride
                  </Text>
                </View>
              </View>
              <Text style={styles.title}>Ofereça caronas com confiança</Text>
              <Text style={styles.subtitle}>
                Motoristas recebem por PIX, aparecem para colegas da instituição e ajudam a reduzir
                custos e trânsito. Leva menos de um minuto para ativar.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Por que vale a pena?</Text>
            <View style={styles.benefitsCol}>
              <BenefitCard
                icon="cash-outline"
                title="Receba no PIX"
                subtitle="Repasses alinhados às corridas que você publicar."
              />
              <BenefitCard
                icon="calendar-outline"
                title="Você manda no calendário"
                subtitle="Escolha horários, lugares e preço sugerido por viagem."
              />
              <BenefitCard
                icon="people-outline"
                title="Rede acadêmica"
                subtitle="Conecte-se a quem faz rotas parecidas com a sua."
              />
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>O que você precisa</Text>
              <Bullet
                icon="key-outline"
                text="Chave PIX válida (preferencialmente no mesmo CPF/nome do cadastro) para receber."
              />
              <Bullet
                icon="person-outline"
                text="Nome e e-mail reais no perfil — passageiros precisam reconhecer você."
              />
              <Bullet
                icon="school-outline"
                text="Uso responsável: caronas entre estudantes e rotas que você realmente faz."
              />
            </View>

            <View style={styles.panelMuted}>
              <View style={styles.panelMutedHeader}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary[700]} />
                <Text style={styles.panelMutedTitle}>Compromissos do motorista</Text>
              </View>
              <Text style={styles.panelMutedBody}>
                Cumprir horário combinado, manter o carro em condições seguras, respeitar a lotação
                informada e cancelar com antecedência se algo mudar. Condutas inadequadas podem
                gerar suspensão da função, conforme os termos do app.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Chave PIX para recebimento</Text>
            <View style={styles.fieldBlock}>
              <AuthTextField
                icon="wallet-outline"
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                value={pix}
                onChangeText={setPix}
                keyboardType="default"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>
                A chave será usada apenas para repasses financeiros. Se já estiver no seu perfil, o
                campo pode permanecer igual — só precisamos enviá-la ao servidor se ainda não houver
                cadastro. Você pode alterá-la depois em Perfil → Finanças.
              </Text>
            </View>

            <View style={styles.termsRow}>
              <Pressable
                onPress={() => setTermsAccepted(!termsAccepted)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                hitSlop={6}
                style={styles.checkboxTouch}>
                <View style={[styles.checkbox, termsAccepted && styles.checkboxOn]}>
                  {termsAccepted ? (
                    <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
                  ) : null}
                </View>
              </Pressable>
              <View style={styles.termsTextCol}>
                <Pressable onPress={() => setTermsAccepted(!termsAccepted)}>
                  <Text style={styles.termsText}>
                    Declaro que li e aceito as regras para motoristas e que minhas informações são
                    verdadeiras.
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    Toast.show({
                      type: 'info',
                      text1: 'Termos',
                      text2: 'O documento completo será publicado no app em breve.',
                    })
                  }>
                  <Text style={styles.termsLink}>Resumo para motoristas</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.primaryWrap}>
              <PrimaryButton label="Ativar perfil de motorista" onPress={onConfirm} loading={loading} />
            </View>
            <Text style={styles.footerNote}>
              Ao continuar, seu usuário passará a poder publicar caronas. Você continua podendo
              reservar lugares como passageiro.
            </Text>
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
  /** Só na tela “já é motorista” (sem linha Campus Ride). */
  scrollHeader: {
    alignSelf: 'stretch',
    width: '100%',
    paddingBottom: spacing[2],
  },
  backBtn: {
    padding: spacing[1],
    marginLeft: -spacing[1],
    marginRight: spacing[1],
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    gap: spacing[5],
    alignItems: 'flex-start',
  },
  hero: {
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
    gap: spacing[3],
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: spacing[1],
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minWidth: 0,
  },
  headerLogoCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: CampusRideColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  brandText: {
    flexShrink: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  title: {
    alignSelf: 'stretch',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: CampusRideColors.text,
    textAlign: 'left',
    lineHeight: 30,
  },
  subtitle: {
    alignSelf: 'stretch',
    fontSize: typography.fontSize.sm,
    color: CampusRideColors.textSecondary,
    textAlign: 'left',
    lineHeight: 22,
  },
  sectionTitle: {
    alignSelf: 'stretch',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  benefitsCol: {
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing[2],
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: CampusRideColors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: CampusRideColors.border,
    padding: spacing[3],
  },
  benefitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextCol: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  benefitSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  panel: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: CampusRideColors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: CampusRideColors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  panelMuted: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
    padding: spacing[4],
    gap: spacing[2],
  },
  panelMutedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  panelMutedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[900],
  },
  panelMutedBody: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[900],
    lineHeight: 21,
    opacity: 0.92,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 21,
  },
  fieldBlock: {
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing[2],
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  termsRow: {
    alignSelf: 'stretch',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  termsTextCol: {
    flex: 1,
    gap: spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: CampusRideColors.white,
  },
  checkboxOn: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: 21,
  },
  termsLink: {
    color: BRAND,
    fontWeight: typography.fontWeight.semiBold,
  },
  footerNote: {
    alignSelf: 'stretch',
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'left',
    lineHeight: 18,
    marginTop: -spacing[2],
  },
  alreadyWrap: {
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[6],
  },
  alreadyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  alreadyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  alreadySub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  alreadyActions: {
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  primaryWrap: {
    alignSelf: 'stretch',
    width: '100%',
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  secondaryLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: BRAND,
  },
});
