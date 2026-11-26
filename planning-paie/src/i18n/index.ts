import { getLocales } from 'expo-localization';
import { useMemo } from 'react';
import { enGB, fr as frLocale, type Locale } from 'date-fns/locale';

import type { Lang } from '../domain/format';
import { useAppStore } from '../store/store';
import { en } from './en';
import { fr, type Dictionary } from './fr';

export type LanguageSetting = 'system' | Lang;

const dictionaries: Record<Lang, Dictionary> = { fr, en };

export function systemLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === 'fr' || !code ? 'fr' : 'en';
  } catch {
    return 'fr';
  }
}

export function resolveLang(setting: LanguageSetting): Lang {
  return setting === 'system' ? systemLang() : setting;
}

/** Remplace {param} dans une chaîne. */
export function fill(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function dateLocale(lang: Lang): Locale {
  return lang === 'fr' ? frLocale : enGB;
}

export interface I18n {
  lang: Lang;
  t: Dictionary;
  locale: Locale;
}

export function useI18n(): I18n {
  const setting = useAppStore((s) => s.settings.language);
  return useMemo(() => {
    const lang = resolveLang(setting);
    return { lang, t: dictionaries[lang], locale: dateLocale(lang) };
  }, [setting]);
}

/** Pour le code hors composants (notifications, calendrier, PDF). */
export function currentI18n(): I18n {
  const lang = resolveLang(useAppStore.getState().settings.language);
  return { lang, t: dictionaries[lang], locale: dateLocale(lang) };
}
