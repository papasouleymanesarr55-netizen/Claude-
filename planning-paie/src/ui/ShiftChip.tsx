import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH } from './kit';
import { readableOn, useTheme } from './theme';

interface Props {
  label: string;
  sub?: string;
  sub2?: string;
  color?: string;
  active?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
  dashed?: boolean;
}

/** Pastille de poste (palette, fiche du jour). */
export const ShiftChip = memo(function ShiftChip({
  label,
  sub,
  sub2,
  color,
  active,
  onPress,
  accessibilityLabel,
  testID,
  dashed,
}: Props) {
  const t = useTheme();
  const bg = color ?? t.surfaceAlt;
  const fg = color ? readableOn(color) : t.text;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: active ? t.text : dashed ? t.textMuted : 'transparent',
          borderStyle: dashed ? 'dashed' : 'solid',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={[styles.label, { color: fg }]}>
        {label}
      </Text>
      {sub || sub2 ? (
        <View>
          {sub ? (
            <Text maxFontSizeMultiplier={1.3} style={[styles.sub, { color: fg }]}>
              {sub}
            </Text>
          ) : null}
          {sub2 ? (
            <Text maxFontSizeMultiplier={1.3} style={[styles.sub, { color: fg }]}>
              {sub2}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH + 8,
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '700', maxWidth: 120 },
  sub: { fontSize: 12, fontWeight: '500', opacity: 0.95 },
});
