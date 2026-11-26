import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useI18n } from '../i18n';
import { useNativeEffects } from '../native/effects';
import { useAppStore } from '../store/store';
import { useTheme } from '../ui/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const theme = useTheme();
  const { t } = useI18n();
  const hydrated = useAppStore((s) => s.hydrated);
  useNativeEffects();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.bg).catch(() => undefined);
  }, [theme.bg]);

  useEffect(() => {
    if (hydrated) void SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.accent,
          headerTitleStyle: { color: theme.text },
          contentStyle: { backgroundColor: theme.bg },
          headerBackTitle: t.common.back,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: t.settings.title }} />
        <Stack.Screen name="recap" options={{ title: t.recap.title }} />
        <Stack.Screen name="rules" options={{ title: t.rules.title }} />
        <Stack.Screen name="premium" options={{ title: t.common.premium, presentation: 'modal' }} />
        <Stack.Screen name="legal" options={{ title: '' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
