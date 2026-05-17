import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SupportScreenLayout, supportUi } from '@/components/support/support-screen-layout';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import { formatMoneyFromCents } from '@/lib/user-types';
import { showAppToast } from '@/lib/show-app-toast';

function InfoRow({
  icon,
  title,
  text,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={supportUi.BRAND_BLUE} />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

export default function WalletBalanceScreen() {
  const { user } = useUser();
  const balanceLabel = formatMoneyFromCents(user?.balanceCents ?? null);
  const hasPix = Boolean(user?.pixKey?.trim());

  function onWithdraw() {
    showAppToast({
      type: 'info',
      text1: 'Saque em breve',
      text2: 'Você poderá transferir o saldo para sua chave PIX cadastrada.',
      translateText2: false,
      visibilityTime: 3200,
    });
  }

  return (
    <SupportScreenLayout title="Saldo disponível" subtitle="Campus Ride · finanças">
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>SALDO DISPONÍVEL</Text>
        <Text style={styles.balanceValue}>{balanceLabel}</Text>
        <Text style={styles.balanceHint}>
          Valor acumulado de caronas com pagamento confirmado por passageiros.
        </Text>
      </View>

      <View style={styles.pixRow}>
        <Ionicons
          name={hasPix ? 'checkmark-circle' : 'alert-circle-outline'}
          size={20}
          color={hasPix ? colors.success[600] : colors.warning[700]}
        />
        <Text style={styles.pixRowText}>
          {hasPix
            ? `Repasse via PIX: ${user?.pixKey}`
            : 'Cadastre uma chave PIX no perfil para receber saques futuros.'}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        onPress={onWithdraw}>
        <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Solicitar saque</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
        onPress={() => router.push('/payment-history' as Href)}>
        <Ionicons name="receipt-outline" size={18} color={supportUi.BRAND_BLUE} />
        <Text style={styles.secondaryBtnText}>Ver histórico de pagamento</Text>
      </Pressable>

      <Text style={supportUi.sectionLabel}>COMO FUNCIONA</Text>
      <View style={styles.infoCard}>
        <InfoRow
          icon="checkmark-done-outline"
          title="Pagamento confirmado"
          text="Quando o passageiro conclui o checkout, sua parte da corrida entra no saldo."
        />
        <View style={styles.infoDivider} />
        <InfoRow
          icon="time-outline"
          title="Saque"
          text="Em breve você poderá sacar para a chave PIX cadastrada. Por enquanto o saldo fica visível aqui."
        />
        <View style={styles.infoDivider} />
        <InfoRow
          icon="shield-checkmark-outline"
          title="Ambiente de demonstração"
          text="Pagamentos são simulados (mock). Valores refletem o que o backend registrou nas corridas."
        />
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={18} color={colors.warning[700]} />
        <Text style={styles.tipText}>
          Dúvidas sobre um valor? Confira o histórico ou fale com o suporte na Central de ajuda.
        </Text>
      </View>
    </SupportScreenLayout>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    ...supportUi.card,
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: supportUi.BRAND_BLUE,
    borderColor: supportUi.BRAND_BLUE,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  balanceHint: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing[1],
  },
  pixRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    ...supportUi.card,
    paddingVertical: spacing[3],
  },
  pixRowText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: supportUi.BRAND_BLUE,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
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
  secondaryBtnPressed: {
    opacity: 0.88,
  },
  secondaryBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: supportUi.BRAND_BLUE,
  },
  infoCard: {
    ...supportUi.card,
    padding: 0,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.muted,
    marginLeft: spacing[4],
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.warning[800],
    lineHeight: 18,
  },
});
