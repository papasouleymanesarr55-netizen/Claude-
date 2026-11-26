import { Platform } from 'react-native';

import { normalizeTimeInput, toHHMM } from '../domain/time';
import { Field } from './kit';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}

/** Heure au format HH:MM ; accepte « 8 », « 830 », « 8h30 » et normalise à la sortie. */
export function TimeField({ label, value, onChange, testID }: Props) {
  const valid = normalizeTimeInput(value) !== null;
  return (
    <Field
      testID={testID}
      label={label}
      value={value}
      error={!valid}
      onChangeText={onChange}
      onBlur={() => {
        const m = normalizeTimeInput(value);
        if (m !== null) onChange(toHHMM(m));
      }}
      placeholder="08:00"
      keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
      maxLength={5}
      selectTextOnFocus
      returnKeyType="next"
    />
  );
}
