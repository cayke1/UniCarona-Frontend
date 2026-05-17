import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';

import { supportUi } from './support-screen-layout';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

type Props = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.group}>
      {items.map((item, index) => {
        const open = openId === item.id;
        return (
          <View key={item.id} style={[styles.rowWrap, index < items.length - 1 && styles.rowBorder]}>
            <Pressable
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}>
              <View style={[styles.iconWrap, open && styles.iconWrapOpen]}>
                <Ionicons
                  name={item.icon ?? 'help-circle-outline'}
                  size={18}
                  color={open ? supportUi.BRAND_BLUE : colors.text.secondary}
                />
              </View>
              <Text style={[styles.question, open && styles.questionOpen]}>{item.question}</Text>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.neutral[400]}
              />
            </Pressable>
            {open ? (
              <View style={styles.answerBox}>
                <Text style={styles.answer}>{item.answer}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.background.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.muted,
    overflow: 'hidden',
  },
  rowWrap: {
    backgroundColor: colors.background.surface,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
  },
  rowPressed: {
    backgroundColor: colors.neutral[50],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOpen: {
    backgroundColor: '#EFF6FF',
  },
  question: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    lineHeight: 20,
  },
  questionOpen: {
    color: supportUi.BRAND_BLUE,
  },
  answerBox: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: 0,
    marginLeft: 36 + spacing[3],
  },
  answer: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 21,
  },
});
