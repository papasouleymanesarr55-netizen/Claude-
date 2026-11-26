import { Pressable, StyleSheet, View } from 'react-native';

import { SHIFT_COLORS } from '../domain/types';
import { fill, useI18n } from '../i18n';
import { MIN_TOUCH } from './kit';
import { useTheme } from './theme';

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={tr.shift.color} style={styles.row}>
      {SHIFT_COLORS.map((c, i) => {
        const active = c.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={fill(tr.shift.colorA11y, { index: i + 1 })}
            onPress={() => onChange(c)}
            style={[styles.dotWrap, { borderColor: active ? t.text : 'transparent' }]}
          >
            <View style={[styles.dot, { backgroundColor: c }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  dotWrap: {
    width: MIN_TOUCH + 4,
    height: MIN_TOUCH + 4,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 34, height: 34, borderRadius: 17 },
});
