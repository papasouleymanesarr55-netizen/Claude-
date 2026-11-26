import type { Lang } from '../domain/format';
import { ADS_BUILD_ENABLED } from '../native/ads';
import legal from './legal.json';
import publisher from './publisher.json';

export type LegalDoc = 'privacy' | 'terms';

export interface LegalText {
  title: string;
  sections: { h: string; p: string[] }[];
}

export function fillPublisher(s: string): string {
  return s
    .replace(/\{\{EMAIL\}\}/g, publisher.email)
    .replace(/\{\{EDITOR\}\}/g, publisher.editor)
    .replace(/\{\{UPDATED\}\}/g, publisher.updated);
}

interface RawSection {
  h: string;
  p: string[];
  onlyWithAds?: boolean;
  onlyWithoutAds?: boolean;
}

/** Garde les sections qui correspondent à l'état de la publicité. */
export function sectionsFor(sections: RawSection[], adsEnabled: boolean): RawSection[] {
  return sections.filter((s) => (adsEnabled ? !s.onlyWithoutAds : !s.onlyWithAds));
}

export function legalText(lang: Lang, doc: LegalDoc, adsEnabled = ADS_BUILD_ENABLED): LegalText {
  const src = legal[lang][doc];
  return {
    title: src.title,
    sections: sectionsFor(src.sections as RawSection[], adsEnabled).map((s) => ({
      h: s.h,
      p: s.p.map(fillPublisher),
    })),
  };
}
