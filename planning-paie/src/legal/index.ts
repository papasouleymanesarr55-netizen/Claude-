import type { Lang } from '../domain/format';
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

export function legalText(lang: Lang, doc: LegalDoc): LegalText {
  const src = legal[lang][doc];
  return {
    title: src.title,
    sections: src.sections.map((s) => ({ h: s.h, p: s.p.map(fillPublisher) })),
  };
}
