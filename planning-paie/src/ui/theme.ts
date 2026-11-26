import { useColorScheme } from 'react-native';

import { useAppStore } from '../store/store';

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  danger: string;
  success: string;
  selected: string;
}

/** Contrastes vérifiés : texte ≥ 4,5:1 sur fond et surface, dans les deux thèmes. */
export const light: Theme = {
  dark: false,
  bg: '#f4f5f8',
  surface: '#ffffff',
  surfaceAlt: '#eceef3',
  text: '#16181d',
  textMuted: '#555b66',
  border: '#d5d8e0',
  accent: '#2348c4',
  onAccent: '#ffffff',
  accentSoft: '#e3e9fb',
  danger: '#b42318',
  success: '#17803d',
  selected: '#2348c4',
};

export const dark: Theme = {
  dark: true,
  bg: '#0e1014',
  surface: '#1a1d23',
  surfaceAlt: '#242831',
  text: '#f2f3f5',
  textMuted: '#aab0bc',
  border: '#343944',
  accent: '#3a5fd9',
  onAccent: '#ffffff',
  accentSoft: '#1f2a4d',
  danger: '#ff8a80',
  success: '#6fd394',
  selected: '#8fa8ff',
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const setting = useAppStore((s) => s.settings.theme);
  const isDark = setting === 'system' ? scheme === 'dark' : setting === 'dark';
  return isDark ? dark : light;
}

/** Couleur de texte lisible (noir ou blanc) sur un fond donné. */
export function readableOn(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/(.)/g, '$1$1') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#111111' : '#ffffff';
}

/** Ajoute une transparence (alpha 0–1) à une couleur #rrggbb. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/(.)/g, '$1$1') : h;
  return `#${full}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
