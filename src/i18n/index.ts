import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';

export const defaultLocale = 'fr';
export const resources = { fr: { translation: fr } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
