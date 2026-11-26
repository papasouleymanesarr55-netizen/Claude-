import { Children, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from './theme';

export const MIN_TOUCH = 44;

/**
 * Texte en cours de saisie pour une valeur externe : affiche la valeur formatée tant que
 * l'utilisateur ne tape rien, puis son brouillon jusqu'à validation (reset).
 */
export function useDraft<T>(value: T, toText: (v: T) => string) {
  const [draft, setDraft] = useState<string | null>(null);
  return { text: draft ?? toText(value), setText: setDraft, reset: () => setDraft(null) };
}

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const t = useTheme();
  const bg =
    variant === 'primary' ? t.accent : variant === 'secondary' ? t.surfaceAlt : 'transparent';
  const fg = variant === 'primary' ? t.onAccent : variant === 'danger' ? t.danger : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        variant === 'danger' && { borderWidth: 1, borderColor: t.danger },
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  error?: boolean;
}

export function Field({ label, error, style, ...rest }: FieldProps) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: t.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.textMuted}
        style={[
          styles.input,
          {
            color: t.text,
            backgroundColor: t.surfaceAlt,
            borderColor: error ? t.danger : t.border,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

/** Champs côte à côte, de largeur égale. */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.fieldRow}>
      {Children.map(children, (c) => (
        <View style={{ flex: 1 }}>{c}</View>
      ))}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.section, { color: t.textMuted }]}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, style]}>
      {children}
    </View>
  );
}

interface RowProps {
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: ReactNode;
  locked?: boolean;
  danger?: boolean;
  testID?: string;
}

export function Row({ label, detail, onPress, right, locked, danger, testID }: RowProps) {
  const t = useTheme();
  const content = (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? t.danger : t.text }]}>
          {label}
          {locked ? '  🔒' : ''}
        </Text>
        {detail ? <Text style={[styles.rowDetail, { color: t.textMuted }]}>{detail}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export function SwitchRow({
  label,
  detail,
  value,
  onChange,
  locked,
  testID,
}: {
  label: string;
  detail?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <Row
      label={label}
      detail={detail}
      locked={locked}
      right={
        <Switch
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ true: t.accent, false: t.border }}
          thumbColor="#ffffff"
        />
      }
    />
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              {
                backgroundColor: active ? t.accent : t.surfaceAlt,
                borderColor: active ? t.accent : t.border,
              },
            ]}
          >
            <Text style={{ color: active ? t.onAccent : t.text, fontWeight: '600' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  field: { marginBottom: 12 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 13, marginBottom: 4, fontWeight: '500' },
  input: {
    minHeight: MIN_TOUCH,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 17,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 6,
    marginHorizontal: 4,
  },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  rowLabel: { fontSize: 16 },
  rowDetail: { fontSize: 13, marginTop: 2 },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 },
  segment: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
