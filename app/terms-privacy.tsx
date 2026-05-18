import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { SupportScreenLayout, supportUi } from '@/components/support/support-screen-layout';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Tab = 'terms' | 'privacy';

type LegalSection = {
  title: string;
  paragraphs: string[];
};

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Aceite dos termos',
    paragraphs: [
      'Ao criar uma conta e usar o UniCarona (Campus Ride), você concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar, não utilize o aplicativo.',
    ],
  },
  {
    title: '2. Natureza do serviço',
    paragraphs: [
      'A plataforma conecta estudantes que oferecem e buscam caronas. Não somos transportadora: motoristas e passageiros são responsáveis pela viagem, pontualidade e conduta.',
      'O pagamento integrado facilita a divisão de custos; valores e disponibilidade dependem dos usuários.',
    ],
  },
  {
    title: '3. Conta e elegibilidade',
    paragraphs: [
      'Você deve fornecer dados verdadeiros (nome, e-mail institucional quando exigido, perfil de motorista com PIX válido).',
      'É proibido usar a conta de terceiros, publicar informações falsas ou praticar fraude no pagamento simulado ou real.',
    ],
  },
  {
    title: '4. Caronas e cancelamentos',
    paragraphs: [
      'Motoristas podem aceitar, recusar ou encerrar caronas conforme as regras do app. Passageiros podem cancelar solicitações nos status permitidos.',
      'Cancelamentos em massa ou comportamento abusivo podem resultar em suspensão da conta.',
    ],
  },
  {
    title: '5. Alterações',
    paragraphs: [
      'Podemos atualizar estes termos. A data da última revisão aparece abaixo. O uso continuado após mudanças indica aceite da nova versão.',
    ],
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Dados que coletamos',
    paragraphs: [
      'Cadastro: nome, e-mail, instituição/curso quando informados, papel (passageiro/motorista), chave PIX para motoristas.',
      'Uso: endereços de origem e destino, horários de carona, solicitações, status de pagamento e localização aproximada para exibir caronas no mapa.',
    ],
  },
  {
    title: 'Como usamos os dados',
    paragraphs: [
      'Para operar o serviço (matching, checkout, notificações futuras), melhorar segurança e cumprir obrigações legais.',
      'Não vendemos seus dados pessoais. Compartilhamos apenas o necessário com provedores de infraestrutura (hospedagem, mapas) sob contrato.',
    ],
  },
  {
    title: 'Localização',
    paragraphs: [
      'Com sua permissão, usamos coordenadas para listar caronas próximas e desenhar rotas. Você pode revogar a permissão nas configurações do dispositivo; algumas funções deixarão de funcionar.',
    ],
  },
  {
    title: 'Seus direitos',
    paragraphs: [
      'Você pode solicitar acesso, correção ou exclusão de dados entrando em contato com suporte@unicarona.app. Guardamos registros mínimos exigidos por lei após exclusão da conta.',
    ],
  },
  {
    title: 'Segurança',
    paragraphs: [
      'Adotamos medidas técnicas razoáveis (HTTPS, tokens de sessão). Nenhum sistema é 100% seguro — evite compartilhar senhas e reporte incidentes.',
    ],
  },
];

const LAST_UPDATED = '17 de maio de 2026';

function LegalBlock({ sections }: { sections: LegalSection[] }) {
  return (
    <View style={styles.legalGroup}>
      {sections.map((section, index) => (
        <View
          key={section.title}
          style={[styles.legalSection, index < sections.length - 1 && styles.legalSectionBorder]}>
          <Text style={styles.legalTitle}>{section.title}</Text>
          {section.paragraphs.map((p, i) => (
            <Text key={i} style={styles.legalParagraph}>
              {p}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function TermsPrivacyScreen() {
  const [tab, setTab] = useState<Tab>('terms');

  const switchTab = (next: Tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTab(next);
  };

  return (
    <SupportScreenLayout title="Termos e privacidade" subtitle="Transparência e proteção de dados">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark-outline" size={28} color={supportUi.BRAND_BLUE} />
        </View>
        <Text style={styles.heroTitle}>Documentos legais</Text>
        <Text style={styles.heroSub}>
          Leia como o Campus Ride trata sua conta, viagens e dados pessoais no ambiente acadêmico.
        </Text>
        <View style={styles.updatedPill}>
          <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.updatedText}>Atualizado em {LAST_UPDATED}</Text>
        </View>
      </View>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segBtn, tab === 'terms' && styles.segBtnActive]}
          onPress={() => switchTab('terms')}>
          <Ionicons
            name="document-text-outline"
            size={16}
            color={tab === 'terms' ? supportUi.BRAND_BLUE : colors.text.tertiary}
          />
          <Text style={[styles.segText, tab === 'terms' && styles.segTextActive]}>Termos de uso</Text>
        </Pressable>
        <Pressable
          style={[styles.segBtn, tab === 'privacy' && styles.segBtnActive]}
          onPress={() => switchTab('privacy')}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={tab === 'privacy' ? supportUi.BRAND_BLUE : colors.text.tertiary}
          />
          <Text style={[styles.segText, tab === 'privacy' && styles.segTextActive]}>Privacidade</Text>
        </Pressable>
      </View>

      {tab === 'terms' ? (
        <>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Estes termos regem o uso do aplicativo UniCarona entre estudantes da mesma comunidade
              acadêmica.
            </Text>
          </View>
          <LegalBlock sections={TERMS_SECTIONS} />
        </>
      ) : (
        <>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Respeitamos a LGPD e boas práticas de privacidade. Esta política explica o que
              coletamos e por quê.
            </Text>
          </View>
          <LegalBlock sections={PRIVACY_SECTIONS} />
        </>
      )}

      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={18} color={colors.text.tertiary} />
        <Text style={styles.footerNoteText}>
          Versão demonstração/acadêmica. Textos podem ser substituídos pela documentação oficial da
          sua instituição ou produto final.
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
  updatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[2],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  updatedText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E8EDF5',
    borderRadius: 14,
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  segBtnActive: {
    backgroundColor: colors.background.surface,
  },
  segText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.tertiary,
  },
  segTextActive: {
    color: supportUi.BRAND_BLUE,
    fontWeight: typography.fontWeight.bold,
  },
  introCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  introText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[800],
    lineHeight: 20,
  },
  legalGroup: {
    backgroundColor: colors.background.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.muted,
    overflow: 'hidden',
  },
  legalSection: {
    padding: spacing[4],
    gap: spacing[2],
  },
  legalSectionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.muted,
  },
  legalTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  legalParagraph: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 21,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[1],
  },
  footerNoteText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
});
