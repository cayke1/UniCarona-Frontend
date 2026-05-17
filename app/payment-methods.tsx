import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentMethodOption } from '@/components/support/payment-method-option';
import { SupportScreenLayout, supportUi } from '@/components/support/support-screen-layout';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import {
  getPreferredPaymentMethod,
  preferredPaymentMethodLabel,
  setPreferredPaymentMethod,
  type PreferredPaymentMethod,
} from '@/lib/payment-preferences';
import { showAppToast } from '@/lib/show-app-toast';
import { isDriverUser } from '@/lib/user-types';

export default function PaymentMethodsScreen() {
  const { user } = useUser();
  const isDriver = user ? isDriverUser(user) : false;
  const [method, setMethod] = useState<PreferredPaymentMethod>('pix');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getPreferredPaymentMethod();
      if (!cancelled) {
        setMethod(stored);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelectMethod = useCallback(async (next: PreferredPaymentMethod) => {
    setMethod(next);
    setSaving(true);
    try {
      await setPreferredPaymentMethod(next);
      showAppToast({
        type: 'success',
        text1: 'Método atualizado',
        text2: preferredPaymentMethodLabel(next),
        translateText2: false,
        visibilityTime: 2200,
      });
    } catch {
      showAppToast({
        type: 'error',
        text1: 'Não foi possível salvar',
        text2: 'Tente novamente em instantes.',
        translateText2: false,
      });
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <SupportScreenLayout title="Métodos de pagamento" subtitle="Campus Ride · finanças">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="wallet-outline" size={28} color={supportUi.BRAND_BLUE} />
        </View>
        <Text style={styles.heroTitle}>Como você paga e recebe</Text>
        <Text style={styles.heroSub}>
          Defina a forma de pagamento padrão nas caronas. No ambiente atual, cobranças são simuladas
          (mock) — nenhum valor real é debitado.
        </Text>
      </View>

      {isDriver ? (
        <>
          <Text style={supportUi.sectionLabel}>RECEBER COMO MOTORISTA</Text>
          <View style={styles.pixCard}>
            <View style={styles.pixIcon}>
              <Ionicons name="qr-code-outline" size={22} color={supportUi.BRAND_BLUE} />
            </View>
            <View style={styles.pixBody}>
              <Text style={styles.pixTitle}>Chave PIX para repasses</Text>
              {user?.pixKey ? (
                <Text style={styles.pixKey} selectable>
                  {user.pixKey}
                </Text>
              ) : (
                <Text style={styles.pixEmpty}>Nenhuma chave cadastrada</Text>
              )}
              <Text style={styles.pixHint}>
                Passageiros pagam pelo app; o valor da carona é creditado no seu saldo após a
                confirmação.
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/become-driver' as Href)}>
            <Ionicons name="create-outline" size={18} color={supportUi.BRAND_BLUE} />
            <Text style={styles.secondaryBtnText}>
              {user?.pixKey ? 'Atualizar chave PIX' : 'Cadastrar chave PIX'}
            </Text>
          </Pressable>
        </>
      ) : null}

      <Text style={supportUi.sectionLabel}>PAGAR COMO PASSAGEIRO (SIMULADO)</Text>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={supportUi.BRAND_BLUE} />
        </View>
      ) : (
        <View style={styles.options}>
          <PaymentMethodOption
            method="pix"
            selected={method === 'pix'}
            title="PIX instantâneo"
            subtitle="Aprovação em segundos no checkout (mock)"
            icon="qr-code-outline"
            onSelect={onSelectMethod}
          />
          <PaymentMethodOption
            method="card"
            selected={method === 'card'}
            title="Cartão de crédito"
            subtitle="Visa, Mastercard, Elo (mock)"
            icon="card-outline"
            onSelect={onSelectMethod}
          />
        </View>
      )}

      {saving ? (
        <Text style={styles.savingHint}>Salvando preferência…</Text>
      ) : (
        <Text style={styles.savingHint}>
          Preferência atual: <Text style={styles.savingBold}>{preferredPaymentMethodLabel(method)}</Text>
        </Text>
      )}

      <View style={styles.tipCard}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary[700]} />
        <Text style={styles.tipText}>
          A escolha acima será usada como padrão no checkout. Integração com gateway real será
          adicionada em versões futuras.
        </Text>
      </View>
    </SupportScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...supportUi.card,
    alignItems: 'center',
    gap: spacing[2],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: spacing[2],
  },
  pixCard: {
    ...supportUi.card,
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  pixIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixBody: {
    flex: 1,
    gap: 4,
  },
  pixTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  pixKey: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: supportUi.BRAND_BLUE,
    lineHeight: 20,
  },
  pixEmpty: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  pixHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 17,
    marginTop: 4,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.muted,
    backgroundColor: colors.background.surface,
  },
  secondaryBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: supportUi.BRAND_BLUE,
  },
  btnPressed: {
    opacity: 0.88,
  },
  options: {
    gap: spacing[2],
  },
  loadingBox: {
    paddingVertical: spacing[6],
    alignItems: 'center',
  },
  savingHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  savingBold: {
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.primary[800],
    lineHeight: 18,
  },
});
