import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { getPreferredPaymentMethod } from '@/lib/payment-preferences';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const C = {
  primary: '#1A3FA0',
  accent: '#F97316',
  bg: '#E8EDF7',
  bgTop: '#DCE4F5',
  card: '#FFFFFF',
  text: '#0D1B3E',
  textSub: '#5C6B8C',
  textMuted: '#8B9BB8',
  border: '#D8E0F0',
  success: '#15803D',
  successBg: '#DCFCE7',
  successBorder: '#BBF7D0',
  chipBg: '#EEF2FF',
};

/** Remove sombra no iOS e elevation no Android. */
const flat = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
} as const;

export function fmtBRL(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function formatDepartureLabel(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?';
}

export function CheckoutHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75} accessibilityRole="button">
        <Ionicons name="arrow-back" size={22} color={C.text} />
      </TouchableOpacity>
      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>{title}</Text>
        {subtitle ? <Text style={s.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={s.headerRight} />
    </View>
  );
}

export function CheckoutStepIndicator({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Resumo' },
    { n: 2, label: 'Pagamento' },
    { n: 3, label: 'Confirmação' },
  ] as const;
  return (
    <View style={s.stepper}>
      {steps.map((st, i) => {
        const done = active > st.n;
        const current = active === st.n;
        return (
          <React.Fragment key={st.n}>
            {i > 0 ? <View style={[s.stepLine, done && s.stepLineDone]} /> : null}
            <View style={s.stepItem}>
              <View
                style={[
                  s.stepCircle,
                  done && s.stepCircleDone,
                  current && !done && s.stepCircleActive,
                ]}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={[s.stepNum, current && s.stepNumActive]}>{st.n}</Text>
                )}
              </View>
              <Text style={[s.stepLabel, (done || current) && s.stepLabelActive]}>{st.label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

export type CheckoutReviewData = {
  rideIdShort: string;
  requestIdShort: string;
  departureIso: string;
  origin: string;
  destination: string;
  driverName: string;
  seats: number;
  pricePerSeat: number;
  subtotal: number;
  appFee: number;
  total: number;
  mockBanner?: string;
};

export function CheckoutReviewScroll({
  data,
  onConfirm,
  confirmLabel,
  confirmDisabled,
}: {
  data: CheckoutReviewData;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
}) {
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const depLabel = useMemo(() => formatDepartureLabel(data.departureIso), [data.departureIso]);

  useEffect(() => {
    void getPreferredPaymentMethod().then(setMethod);
  }, []);
  const perSeat = data.seats > 0 ? data.subtotal / data.seats : data.pricePerSeat;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {data.mockBanner ? (
        <View style={s.previewBanner}>
          <Ionicons name="flask-outline" size={18} color="#92400E" />
          <Text style={s.previewBannerText}>{data.mockBanner}</Text>
        </View>
      ) : null}

      <CheckoutStepIndicator active={2} />

      <View style={s.heroCard}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroKicker}>PEDIDO DE CARONA</Text>
            <Text style={s.heroTitle}>#{data.rideIdShort}</Text>
          </View>
          <View style={s.statusPill}>
            <Text style={s.statusPillText}>Aguardando pagamento</Text>
          </View>
        </View>
        <View style={s.heroMetaRow}>
          <Ionicons name="calendar-outline" size={16} color={C.primary} />
          <Text style={s.heroMetaText}>{depLabel}</Text>
        </View>
        <View style={s.heroMetaRow}>
          <Ionicons name="document-text-outline" size={16} color={C.textSub} />
          <Text style={s.heroMetaMuted}>Solicitação ···{data.requestIdShort}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardKicker}>TRAJETO</Text>
        <View style={s.routeBlock}>
          <View style={s.routeRow}>
            <View style={s.dotOrigin} />
            <View style={s.routeTextCol}>
              <Text style={s.routeLabel}>Origem</Text>
              <Text style={s.routeValue} numberOfLines={3}>
                {data.origin}
              </Text>
            </View>
          </View>
          <View style={s.routeConnector} />
          <View style={s.routeRow}>
            <View style={s.dotDest}>
              <Ionicons name="location" size={11} color="#FFFFFF" />
            </View>
            <View style={s.routeTextCol}>
              <Text style={s.routeLabel}>Destino</Text>
              <Text style={s.routeValue} numberOfLines={3}>
                {data.destination}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardKicker}>MOTORISTA</Text>
        <View style={s.driverRow}>
          <View style={s.driverAvatar}>
            <Text style={s.driverAvatarTxt}>{initials(data.driverName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.driverName}>{data.driverName}</Text>
            <View style={s.driverChips}>
              <View style={s.miniChip}>
                <Ionicons name="shield-checkmark" size={12} color={C.success} />
                <Text style={s.miniChipText}>Verificado</Text>
              </View>
              <View style={s.miniChip}>
                <Ionicons name="star" size={12} color="#CA8A04" />
                <Text style={s.miniChipText}>Campus Ride</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardKicker}>VALORES</Text>
        <View style={s.priceRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.priceMainLabel}>Subtotal da carona</Text>
            <Text style={s.priceHint}>
              {data.seats} vaga{data.seats !== 1 ? 's' : ''} × R$ {fmtBRL(perSeat)}
            </Text>
          </View>
          <Text style={s.priceMainValue}>R$ {fmtBRL(data.subtotal)}</Text>
        </View>
        <View style={s.priceRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.priceMainLabel}>Taxa da plataforma</Text>
            <Text style={s.priceHint}>Manutenção do app, suporte e segurança (~10%)</Text>
          </View>
          <Text style={s.priceMainValue}>R$ {fmtBRL(data.appFee)}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.totalBanner}>
          <View>
            <Text style={s.totalLabel}>Total a pagar</Text>
            <Text style={s.totalHint}>Cobrança única nesta etapa</Text>
          </View>
          <Text style={s.totalValue}>R$ {fmtBRL(data.total)}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardKicker}>FORMA DE PAGAMENTO (SIMULADO)</Text>
        <Text style={s.paySectionHint}>Escolha uma opção — integração real virá depois.</Text>
        <TouchableOpacity
          style={[s.payOption, method === 'pix' && s.payOptionOn]}
          onPress={() => setMethod('pix')}
          activeOpacity={0.85}>
          <View style={[s.payIconWrap, method === 'pix' && s.payIconWrapOn]}>
            <Ionicons name="qr-code-outline" size={22} color={method === 'pix' ? C.primary : C.textSub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.payTitle}>PIX instantâneo</Text>
            <Text style={s.paySub}>Aprovação em segundos (mock)</Text>
          </View>
          {method === 'pix' ? <Ionicons name="checkmark-circle" size={22} color={C.primary} /> : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.payOption, method === 'card' && s.payOptionOn]}
          onPress={() => setMethod('card')}
          activeOpacity={0.85}>
          <View style={[s.payIconWrap, method === 'card' && s.payIconWrapOn]}>
            <Ionicons name="card-outline" size={22} color={method === 'card' ? C.primary : C.textSub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.payTitle}>Cartão de crédito</Text>
            <Text style={s.paySub}>Visa, Mastercard, Elo (mock)</Text>
          </View>
          {method === 'card' ? <Ionicons name="checkmark-circle" size={22} color={C.primary} /> : null}
        </TouchableOpacity>
      </View>

      <View style={s.trustGrid}>
        <View style={s.trustCell}>
          <Ionicons name="lock-closed-outline" size={20} color={C.primary} />
          <Text style={s.trustTitle}>Conexão segura</Text>
          <Text style={s.trustSub}>Dados criptografados em trânsito</Text>
        </View>
        <View style={s.trustCell}>
          <Ionicons name="receipt-outline" size={20} color={C.primary} />
          <Text style={s.trustTitle}>Recibo</Text>
          <Text style={s.trustSub}>Disponível após confirmação</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[s.primaryBtn, confirmDisabled && { opacity: 0.55 }]}
        onPress={onConfirm}
        disabled={confirmDisabled}
        activeOpacity={0.88}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#FFFFFF" />
        <Text style={s.primaryBtnText}>{confirmLabel ?? 'Confirmar pagamento'}</Text>
      </TouchableOpacity>

      <Text style={s.finePrint}>
        Ao confirmar, você concorda com os valores acima e com os termos da Campus Ride. Esta transação é
        mockada: nenhuma cobrança real será efetuada.
      </Text>
    </ScrollView>
  );
}

export function CheckoutProcessingView() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 3), 500);
    return () => clearInterval(id);
  }, []);
  const dots = '.'.repeat(tick + 1);
  return (
    <View style={s.processWrap}>
      <View style={s.processRing}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
      <Text style={s.processTitle}>Processando pagamento{dots}</Text>
      <Text style={s.processSub}>Validando com o emissor e reservando sua vaga.</Text>
      <View style={s.processList}>
        <View style={s.processLi}>
          <Ionicons name="ellipse" size={6} color={C.textMuted} />
          <Text style={s.processLiText}>Autenticação do pedido</Text>
        </View>
        <View style={s.processLi}>
          <Ionicons name="ellipse" size={6} color={C.textMuted} />
          <Text style={s.processLiText}>Registro do comprovante</Text>
        </View>
        <View style={s.processLi}>
          <Ionicons name="ellipse" size={6} color={C.textMuted} />
          <Text style={s.processLiText}>Atualização do status da solicitação</Text>
        </View>
      </View>
    </View>
  );
}

export type CheckoutSuccessData = {
  rideIdShort: string;
  origin: string;
  destination: string;
  driverName: string;
  total: number;
  seats: number;
  mockNote?: string;
};

export function CheckoutSuccessScroll({
  data,
  onDone,
  doneLabel,
}: {
  data: CheckoutSuccessData;
  onDone: () => void;
  doneLabel?: string;
}) {
  const txRef = useMemo(
    () => `CR-${data.rideIdShort}-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    [data.rideIdShort]
  );

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <CheckoutStepIndicator active={3} />

      <View style={s.successHero}>
        <View style={s.successIconWrap}>
          <Ionicons name="checkmark-done" size={40} color="#FFFFFF" />
        </View>
        <Text style={s.successTitle}>Pagamento confirmado</Text>
        <Text style={s.successSub}>
          Sua solicitação foi atualizada para <Text style={s.bold}>PAGA</Text>. Guarde o número de referência
          abaixo.
        </Text>
        {data.mockNote ? (
          <View style={s.mockNote}>
            <Text style={s.mockNoteText}>{data.mockNote}</Text>
          </View>
        ) : null}
      </View>

      <View style={s.successReceiptCard}>
        <Text style={s.receiptKicker}>COMPROVANTE</Text>
        <Text style={s.receiptRef}>{txRef}</Text>
        <View style={s.divider} />
        <View style={s.receiptRow}>
          <Text style={s.receiptLabel}>Total pago</Text>
          <Text style={s.receiptAmount}>R$ {fmtBRL(data.total)}</Text>
        </View>
        <View style={s.receiptRow}>
          <Text style={s.receiptLabel}>Vagas</Text>
          <Text style={s.receiptValue}>{data.seats}</Text>
        </View>
        <View style={s.receiptRow}>
          <Text style={s.receiptLabel}>Motorista</Text>
          <Text style={s.receiptValue}>{data.driverName}</Text>
        </View>
      </View>

      <View style={s.successSummaryCard}>
        <Text style={s.cardKicker}>RESUMO DA VIAGEM</Text>
        <View style={s.routeBlock}>
          <View style={s.routeRow}>
            <View style={s.dotOrigin} />
            <Text style={s.routeValue} numberOfLines={3}>
              {data.origin}
            </Text>
          </View>
          <View style={s.routeConnector} />
          <View style={s.routeRow}>
            <View style={s.dotDest}>
              <Ionicons name="location" size={11} color="#FFFFFF" />
            </View>
            <Text style={s.routeValue} numberOfLines={3}>
              {data.destination}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.successNextCard}>
        <Text style={s.nextTitle}>Próximos passos</Text>
        <View style={s.nextLi}>
          <Ionicons name="time-outline" size={18} color={C.primary} />
          <Text style={s.nextText}>Chegue ao ponto de embarque com alguns minutos de antecedência.</Text>
        </View>
        <View style={s.nextLi}>
          <Ionicons name="chatbubbles-outline" size={18} color={C.primary} />
          <Text style={s.nextText}>Combine detalhes finais com o motorista pelo app (em breve).</Text>
        </View>
        <View style={s.nextLi}>
          <Ionicons name="document-text-outline" size={18} color={C.primary} />
          <Text style={s.nextText}>Em produção, o recibo será enviado ao seu e-mail cadastrado.</Text>
        </View>
      </View>

      <TouchableOpacity style={s.successPrimaryBtn} onPress={onDone} activeOpacity={0.88}>
        <Text style={s.primaryBtnText}>{doneLabel ?? 'Concluir'}</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

export function CheckoutErrorBlock({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <View style={s.errorWrap}>
      <View style={s.errorCard}>
        <View style={s.errorIconCircle}>
          <Ionicons name="cloud-offline-outline" size={32} color="#B91C1C" />
        </View>
        <Text style={s.errorTitle}>Não foi possível concluir</Text>
        <Text style={s.errorMsg}>{message}</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onRetry} activeOpacity={0.88}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={s.primaryBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.textBtn} onPress={onBack}>
          <Text style={s.textBtnLabel}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  headerCenter: { flex: 1, paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text, textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 2 },
  headerRight: { width: 44 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  stepItem: { alignItems: 'center', minWidth: 72 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  stepCircleActive: { borderColor: C.primary, backgroundColor: C.chipBg },
  stepCircleDone: { borderColor: C.success, backgroundColor: C.success },
  stepNum: { fontSize: 12, fontWeight: '800', color: C.textMuted },
  stepNumActive: { color: C.primary },
  stepLabel: { marginTop: 6, fontSize: 10, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase' },
  stepLabelActive: { color: C.text },
  stepLine: { width: 24, height: 2, backgroundColor: C.border, marginBottom: 20 },
  stepLineDone: { backgroundColor: C.success },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  previewBannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#92400E', lineHeight: 17 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  heroCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    gap: 10,
    ...flat,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroKicker: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.2 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: C.text, marginTop: 2 },
  statusPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  statusPillText: { fontSize: 11, fontWeight: '800', color: '#C2410C' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroMetaText: { fontSize: 14, fontWeight: '600', color: C.text },
  heroMetaMuted: { fontSize: 13, color: C.textSub },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
    ...flat,
  },
  cardKicker: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 1.3 },
  routeBlock: { gap: 0 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeTextCol: { flex: 1 },
  routeLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, marginBottom: 2 },
  routeValue: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22 },
  dotOrigin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.primary,
    marginTop: 4,
  },
  dotDest: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  routeConnector: {
    marginLeft: 5,
    borderLeftWidth: 2,
    borderColor: C.border,
    minHeight: 16,
    marginVertical: 4,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.border,
  },
  driverAvatarTxt: { fontSize: 18, fontWeight: '900', color: C.primary },
  driverName: { fontSize: 17, fontWeight: '800', color: C.text },
  driverChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniChipText: { fontSize: 11, fontWeight: '700', color: C.textSub },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  priceMainLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  priceHint: { fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 17 },
  priceMainValue: { fontSize: 16, fontWeight: '800', color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 6 },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.chipBg,
    marginHorizontal: -6,
    padding: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '900', color: C.text },
  totalHint: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  totalValue: { fontSize: 22, fontWeight: '900', color: C.primary },
  paySectionHint: { fontSize: 12, color: C.textMuted, marginBottom: 10, lineHeight: 17 },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.border,
    marginBottom: 10,
    gap: 12,
    backgroundColor: C.card,
  },
  payOptionOn: { borderColor: C.primary, backgroundColor: '#F8FAFF' },
  payIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payIconWrapOn: { backgroundColor: C.chipBg },
  payTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  paySub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  trustGrid: { flexDirection: 'row', gap: 10 },
  trustCell: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  trustTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  trustSub: { fontSize: 11, color: C.textMuted, lineHeight: 15 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
    ...flat,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  finePrint: {
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  processWrap: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  processRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: C.card,
    ...flat,
  },
  processTitle: { fontSize: 19, fontWeight: '900', color: C.text, textAlign: 'center' },
  processSub: {
    fontSize: 14,
    color: C.textSub,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  processList: { alignSelf: 'stretch', marginTop: 20, gap: 10, maxWidth: 320 },
  processLi: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  processLiText: { fontSize: 13, color: C.textSub },
  successHero: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...flat,
  },
  successReceiptCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.successBorder,
    backgroundColor: '#F0FDF4',
    ...flat,
  },
  successSummaryCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
    ...flat,
  },
  successNextCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...flat,
  },
  successPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
    ...flat,
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: C.text, textAlign: 'center' },
  successSub: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },
  bold: { fontWeight: '900', color: C.text },
  mockNote: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF9C3',
    borderRadius: 10,
  },
  mockNoteText: { fontSize: 12, fontWeight: '600', color: '#854D0E', textAlign: 'center' },
  receiptCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.successBorder,
    backgroundColor: '#F0FDF4',
    ...flat,
  },
  receiptKicker: { fontSize: 10, fontWeight: '800', color: C.success, letterSpacing: 1.2 },
  receiptRef: { fontSize: 16, fontWeight: '900', color: C.text, marginTop: 6, letterSpacing: 0.5 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  receiptLabel: { fontSize: 13, color: C.textSub },
  receiptAmount: { fontSize: 18, fontWeight: '900', color: C.success },
  receiptValue: { fontSize: 13, fontWeight: '700', color: C.text },
  nextCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...flat,
  },
  nextTitle: { fontSize: 14, fontWeight: '900', color: C.text, marginBottom: 4 },
  nextLi: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nextText: { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 19 },
  errorWrap: { flex: 1, padding: 20, justifyContent: 'center' },
  errorCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...flat,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: { fontSize: 18, fontWeight: '900', color: C.text },
  errorMsg: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  textBtn: { paddingVertical: 12 },
  textBtnLabel: { fontSize: 15, fontWeight: '800', color: C.primary },
});
