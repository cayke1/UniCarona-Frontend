import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import {
  createPlacesSessionToken,
  fetchPlacePredictions,
  isGooglePlacesConfigured,
  resolvePlaceDetails,
  type PlacePrediction,
  type ResolvedPlace,
} from '@/lib/google-places';

export type AddressAutocompleteSelection = ResolvedPlace;

type Props = {
  label: string;
  /** Texto auxiliar abaixo do rótulo (ex.: campo obrigatório). */
  description?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onPlaceResolved: (place: AddressAutocompleteSelection | null) => void;
  icon?: 'origin' | 'destination';
  containerStyle?: StyleProp<ViewStyle>;
  zIndex?: number;
};

const DEBOUNCE_MS = 320;

export function AddressAutocompleteField({
  label,
  description,
  placeholder,
  value,
  onChangeText,
  onPlaceResolved,
  icon = 'origin',
  containerStyle,
  zIndex = 1,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [resolving, setResolving] = useState(false);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configured = isGooglePlacesConfigured();

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const loadSuggestions = useCallback(
    async (query: string) => {
      if (!configured || query.trim().length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchPlacePredictions(query, sessionTokenRef.current);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [configured]
  );

  useEffect(() => {
    return () => {
      clearDebounce();
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, [clearDebounce]);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    onPlaceResolved(null);
    clearDebounce();
    if (!configured || text.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void loadSuggestions(text);
    }, DEBOUNCE_MS);
  };

  const handleSelect = async (item: PlacePrediction) => {
    clearDebounce();
    setSuggestions([]);
    setFocused(false);
    Keyboard.dismiss();
    onChangeText(item.description);
    setResolving(true);
    try {
      const resolved = await resolvePlaceDetails(item.placeId, sessionTokenRef.current);
      sessionTokenRef.current = createPlacesSessionToken();
      if (resolved) {
        onChangeText(resolved.formattedAddress || item.description);
        onPlaceResolved(resolved);
      } else {
        onPlaceResolved(null);
      }
    } finally {
      setResolving(false);
    }
  };

  const showDropdown =
    focused && configured && (loading || suggestions.length > 0) && !resolving;

  const dotColor = icon === 'origin' ? colors.success[600] : colors.error[600];

  return (
    <View style={[styles.wrap, { zIndex }, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <View style={[styles.dot, { borderColor: dotColor }]}>
          <View style={[styles.dotInner, { backgroundColor: dotColor }]} />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
            setFocused(true);
            if (value.trim().length >= 2) void loadSuggestions(value);
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => setFocused(false), 200);
          }}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {(loading || resolving) && (
          <ActivityIndicator size="small" color={colors.primary[600]} style={styles.spinner} />
        )}
      </View>

      {showDropdown ? (
        <View style={styles.dropdown}>
          {loading && suggestions.length === 0 ? (
            <View style={styles.dropdownHint}>
              <Text style={styles.dropdownHintText}>Buscando endereços…</Text>
            </View>
          ) : (
            suggestions.map((item, index) => (
              <Pressable
                key={item.placeId}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  index < suggestions.length - 1 && styles.suggestionRowBorder,
                  pressed && styles.suggestionRowPressed,
                ]}
                onPress={() => void handleSelect(item)}>
                <Ionicons name="location-outline" size={18} color={colors.primary[600]} />
                <View style={styles.suggestionTextCol}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text style={styles.suggestionSub} numberOfLines={2}>
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing[1.5],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    lineHeight: 17,
    marginTop: -2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    minHeight: 52,
  },
  inputRowFocused: {
    borderColor: colors.primary[400],
    borderWidth: 1.5,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  dotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: spacing[3],
  },
  spinner: {
    marginLeft: spacing[2],
  },
  dropdown: {
    marginTop: spacing[1],
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    maxHeight: 220,
    shadowColor: '#0A1929',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHint: {
    padding: spacing[3],
  },
  dropdownHintText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  suggestionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.muted,
  },
  suggestionRowPressed: {
    backgroundColor: colors.primary[50],
  },
  suggestionTextCol: {
    flex: 1,
    gap: 2,
  },
  suggestionMain: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  suggestionSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
