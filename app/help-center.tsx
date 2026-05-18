import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { FaqAccordion, type FaqItem } from '@/components/support/faq-accordion';
import { SupportScreenLayout, supportUi } from '@/components/support/support-screen-layout';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

const SUPPORT_EMAIL = 'suporte@unicarona.app';

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'request',
    icon: 'search-outline',
    question: 'Como solicito uma carona?',
    answer:
      'Na aba Home, toque em uma carona no mapa ou na lista. Confira origem, destino e valor, depois envie a solicitação. O motorista precisa aceitar; em seguida você conclui o pagamento na tela de checkout.',
  },
  {
    id: 'publish',
    icon: 'car-outline',
    question: 'Como publico uma carona?',
    answer:
      'Torne-se motorista no perfil (com chave PIX). Depois use o botão flutuante ou Publicar carona no perfil. Informe origem, destino, data/hora e vagas. A carona fica visível para outros estudantes na região.',
  },
  {
    id: 'payment',
    icon: 'card-outline',
    question: 'Como funciona o pagamento?',
    answer:
      'Após o motorista aceitar, você é direcionado ao checkout com o valor da vaga e taxa da plataforma. No ambiente de demonstração, o pagamento é simulado (mock) — nenhuma cobrança real é feita.',
  },
  {
    id: 'cancel',
    icon: 'close-circle-outline',
    question: 'Posso cancelar uma solicitação?',
    answer:
      'Sim, enquanto o status estiver pendente ou aguardando pagamento, você pode cancelar em Caronas → Enviadas. Após o pagamento confirmado, combine com o motorista pelos canais do app.',
  },
  {
    id: 'driver',
    icon: 'people-outline',
    question: 'Como aceito passageiros?',
    answer:
      'Em Caronas → Recebidas, abra a carona publicada e use Aceitar ou Recusar em cada solicitação. Você pode fechar novas solicitações pelo interruptor de embarque na tela da carona.',
  },
];

export default function HelpCenterScreen() {
  return (
    <SupportScreenLayout
      title="Central de ajuda"
      subtitle="Campus Ride · perguntas frequentes">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="help-buoy-outline" size={28} color={supportUi.BRAND_BLUE} />
        </View>
        <Text style={styles.heroTitle}>Como podemos ajudar?</Text>
        <Text style={styles.heroSub}>
          Respostas rápidas sobre caronas, pagamentos e sua conta. Se não encontrar o que precisa,
          fale com o suporte.
        </Text>
      </View>

      <Text style={supportUi.sectionLabel}>PERGUNTAS FREQUENTES</Text>
      <FaqAccordion items={FAQ_ITEMS} />

      <Text style={supportUi.sectionLabel}>AINDA PRECISA DE AJUDA?</Text>
      <View style={styles.contactCard}>
        <View style={styles.contactIcon}>
          <Ionicons name="mail-outline" size={22} color={supportUi.BRAND_BLUE} />
        </View>
        <View style={styles.contactBody}>
          <Text style={styles.contactTitle}>Fale com o suporte</Text>
          <Text style={styles.contactSub}>
            Envie dúvidas, problemas com pagamento ou sugestões. Respondemos em dias úteis.
          </Text>
          <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Suporte%20UniCarona`)}>
        <Ionicons name="send-outline" size={20} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Enviar e-mail</Text>
      </Pressable>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={18} color={colors.warning[700]} />
        <Text style={styles.tipText}>
          Em caso de emergência durante a viagem, utilize os serviços oficiais da sua cidade e
          comunique sua instituição.
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
  contactCard: {
    ...supportUi.card,
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBody: {
    flex: 1,
    gap: 4,
  },
  contactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  contactSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  contactEmail: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: supportUi.BRAND_BLUE,
    marginTop: 4,
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
