import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import {
  clampDepartureTimeToDate,
  dateTimeFromYmdAndHm,
  formatDepartureDateLabel,
  formatDepartureDateYmd,
  formatDepartureTimeHm,
  getDefaultDepartureFields,
  getDepartureTimePickerBounds,
  listDepartureTimeSlots,
  parseDepartureDateYmd,
  startOfToday,
  DEPARTURE_SLOT_MINUTES,
} from '@/lib/publish-ride-helpers';

type Props = {
  dateYmd: string;
  timeHm: string;
  onChangeDate: (dateYmd: string) => void;
  onChangeTime: (timeHm: string) => void;
};

function PickerSheet({
  title,
  visible,
  onClose,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.modalDone}>OK</Text>
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DepartureScheduleFields({ dateYmd, timeHm, onChangeDate, onChangeTime }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [androidDateDraft, setAndroidDateDraft] = useState<Date>(() => {
    return parseDepartureDateYmd(dateYmd) ?? new Date();
  });
  const [androidTimeDraft, setAndroidTimeDraft] = useState<Date>(() => {
    return dateTimeFromYmdAndHm(dateYmd, timeHm);
  });

  const timeSlots = useMemo(() => listDepartureTimeSlots(dateYmd), [dateYmd]);
  const timeBounds = useMemo(() => getDepartureTimePickerBounds(dateYmd), [dateYmd]);

  useEffect(() => {
    if (timeSlots.length === 0) return;
    if (!timeSlots.includes(timeHm)) {
      onChangeTime(timeSlots[0]);
    }
  }, [dateYmd, timeHm, timeSlots, onChangeTime]);

  const dateValue = parseDepartureDateYmd(dateYmd) ?? new Date();
  const timeValue = dateTimeFromYmdAndHm(dateYmd, timeHm);
  const minDate = startOfToday();

  const onDatePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed' || !selected) return;
    }
    const picked = selected ?? dateValue;
    const ymd = formatDepartureDateYmd(picked);
    onChangeDate(ymd);
    onChangeTime(clampDepartureTimeToDate(ymd, timeHm));
  };

  const onTimePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'dismissed' || !selected) return;
    }
    const picked = selected ?? timeValue;
    const hm = clampDepartureTimeToDate(dateYmd, formatDepartureTimeHm(picked));
    onChangeTime(hm);
  };

  const openDatePicker = () => {
    setAndroidDateDraft(dateValue);
    setShowDatePicker(true);
    setShowTimePicker(false);
  };

  const openTimePicker = () => {
    if (timeSlots.length === 0) return;
    setAndroidTimeDraft(timeValue);
    setShowTimePicker(true);
    setShowDatePicker(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Data</Text>
          <Pressable
            style={({ pressed }) => [styles.selector, pressed && styles.selectorPressed]}
            onPress={openDatePicker}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary[600]} />
            <Text style={styles.selectorText} numberOfLines={2}>
              {formatDepartureDateLabel(dateYmd)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.text.tertiary} />
          </Pressable>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Horário</Text>
          <Pressable
            style={({ pressed }) => [
              styles.selector,
              pressed && styles.selectorPressed,
              timeSlots.length === 0 && styles.selectorDisabled,
            ]}
            onPress={openTimePicker}
            disabled={timeSlots.length === 0}>
            <Ionicons name="time-outline" size={20} color={colors.primary[600]} />
            <Text style={styles.selectorText}>{timeHm}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.text.tertiary} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.hint}>
        Horários a cada 15 min, sempre pelo menos 15 min à frente do agora.
      </Text>

      {timeSlots.length === 0 ? (
        <Text style={styles.emptySlots}>Não há mais horários hoje. Escolha outro dia.</Text>
      ) : null}

      <PickerSheet
        title="Data da partida"
        visible={showDatePicker && Platform.OS === 'ios'}
        onClose={() => setShowDatePicker(false)}>
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="spinner"
          minimumDate={minDate}
          locale="pt-BR"
          onChange={onDatePickerChange}
        />
      </PickerSheet>

      <PickerSheet
        title="Horário da partida"
        visible={showTimePicker && Platform.OS === 'ios'}
        onClose={() => setShowTimePicker(false)}>
        <DateTimePicker
          value={timeValue}
          mode="time"
          display="spinner"
          minuteInterval={DEPARTURE_SLOT_MINUTES}
          minimumDate={timeBounds.minimumDate}
          maximumDate={timeBounds.maximumDate}
          locale="pt-BR"
          onChange={onTimePickerChange}
        />
      </PickerSheet>

      {showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={androidDateDraft}
          mode="date"
          display="default"
          minimumDate={minDate}
          onChange={onDatePickerChange}
        />
      ) : null}

      {showTimePicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={androidTimeDraft}
          mode="time"
          display="default"
          minuteInterval={DEPARTURE_SLOT_MINUTES}
          minimumDate={timeBounds.minimumDate}
          maximumDate={timeBounds.maximumDate}
          onChange={onTimePickerChange}
        />
      ) : null}
    </View>
  );
}

export function useInitialDepartureFields() {
  return useMemo(() => getDefaultDepartureFields(), []);
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing[1.5],
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  col: {
    flex: 1,
    gap: spacing[1.5],
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    minHeight: 52,
  },
  selectorPressed: {
    opacity: 0.92,
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    lineHeight: 17,
  },
  emptySlots: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing[6],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.muted,
  },
  modalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  modalDone: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
});
