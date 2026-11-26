import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { knownEmployers } from '../domain/recap';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/store';
import { Field, MIN_TOUCH } from './kit';
import { useTheme } from './theme';

/** Entreprise / mission, avec les noms déjà utilisés proposés en un toucher. */
export function EmployerField({
  value,
  onChange,
  testID,
}: {
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}) {
  const theme = useTheme();
  const { t } = useI18n();
  const shifts = useAppStore((s) => s.shifts);
  const days = useAppStore((s) => s.days);
  const known = knownEmployers(shifts, days).filter((e) => e !== value.trim());
  return (
    <View>
      <Field
        testID={testID}
        label={t.shift.employer}
        value={value}
        onChangeText={onChange}
        placeholder={t.shift.employerPlaceholder}
        maxLength={40}
        autoCapitalize="words"
      />
      {known.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}
        >
          {known.map((e) => (
            <Pressable
              key={e}
              accessibilityRole="button"
              accessibilityLabel={`${t.shift.employer} : ${e}`}
              onPress={() => onChange(e)}
              style={[
                styles.chip,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: theme.text, fontWeight: '600' }}>{e}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingBottom: 12, marginTop: -4 },
  chip: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
  },
});
