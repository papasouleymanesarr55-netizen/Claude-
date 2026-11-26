import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text } from 'react-native';

import { PRIVACY_URL, TERMS_URL } from '../config';
import { useI18n } from '../i18n';
import { legalText, type LegalDoc } from '../legal';
import { Button } from '../ui/kit';
import { useTheme } from '../ui/theme';

export default function LegalScreen() {
  const theme = useTheme();
  const { lang } = useI18n();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const which: LegalDoc = doc === 'terms' ? 'terms' : 'privacy';
  const text = legalText(lang, which);
  const url = which === 'terms' ? TERMS_URL : PRIVACY_URL;
  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: text.title }} />
      {text.sections.map((s) => (
        <Text key={s.h} style={{ color: theme.text }}>
          <Text accessibilityRole="header" style={styles.h}>
            {s.h}
            {'\n'}
          </Text>
          {s.p.map((p, i) => (
            <Text key={i} style={styles.p}>
              {p}
              {'\n\n'}
            </Text>
          ))}
        </Text>
      ))}
      <Button
        label={url.replace('https://', '')}
        variant="ghost"
        onPress={() => void Linking.openURL(url)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  h: { fontSize: 18, fontWeight: '700' },
  p: { fontSize: 15, lineHeight: 22 },
});
