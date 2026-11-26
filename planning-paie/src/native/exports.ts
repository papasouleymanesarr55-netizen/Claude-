import { format } from 'date-fns';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

import { exportBackup } from '../domain/backup';
import { computeMonth, netFrom, resolveDay } from '../domain/calc';
import { formatHours, formatMoney, formatNumber } from '../domain/format';
import { parseDayKey, toHHMM } from '../domain/time';
import { currentI18n, fill } from '../i18n';
import { selectPremium, useAppStore } from '../store/store';
import { shareFileUri, shareTextFile } from './files';

export async function exportJson(now = new Date()): Promise<void> {
  const s = useAppStore.getState();
  const file = exportBackup(
    {
      shifts: s.shifts,
      days: s.days,
      charges: s.settings.charges,
      lastRate: s.settings.lastRate,
      rules: s.rules,
    },
    now,
  );
  const name = `planning-paie-${format(now, 'yyyy-MM-dd')}.json`;
  await shareTextFile(name, JSON.stringify(file, null, 2), 'application/json', 'public.json');
}

export interface MonthRow {
  date: string;
  shift: string;
  times: string;
  hours: string;
  gross: string;
  note: string;
  rawHours: number;
  rawGross: number;
}

/** Lignes de la feuille d'heures d'un mois (utilisées par le PDF et le CSV). */
export function monthRows(year: number, month0: number) {
  const s = useAppStore.getState();
  const { t, lang, locale } = currentI18n();
  const summary = computeMonth(
    { shifts: s.shifts, days: s.days, rules: s.rules, advanced: selectPremium(s) },
    year,
    month0,
  );
  const map = new Map(s.shifts.map((x) => [x.id, x]));
  const rows: MonthRow[] = Object.keys(summary.days)
    .sort()
    .map((key) => {
      const pay = summary.days[key]!;
      const day = resolveDay(key, s.days[key], map)!;
      return {
        date: format(parseDayKey(key), 'EEE d MMM', { locale }),
        shift: day.shift?.name ?? t.day.customShift,
        times: `${toHHMM(day.start)}–${toHHMM(day.end)}${day.pause ? ` (−${day.pause} min)` : ''}`,
        hours: formatHours(pay.hours, lang),
        gross: formatMoney(pay.gross, lang),
        note: day.note ?? '',
        rawHours: pay.hours,
        rawGross: pay.gross,
      };
    });
  const monthLabel = format(new Date(year, month0, 1), 'LLLL yyyy', { locale });
  return {
    rows,
    summary,
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    net: netFrom(summary.gross, s.settings.charges),
    charges: s.settings.charges,
  };
}

function esc(v: string): string {
  return v.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}

export function timesheetHtml(year: number, month0: number): string {
  const { t, lang } = currentI18n();
  const { rows, summary, monthLabel, net, charges } = monthRows(year, month0);
  const body = rows
    .map(
      (r) =>
        `<tr><td>${esc(r.date)}</td><td>${esc(r.shift)}</td><td>${esc(r.times)}</td><td class="n">${esc(r.hours)}</td><td class="n">${esc(r.gross)}</td><td>${esc(r.note)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(fill(t.pdf.title, { month: monthLabel }))}</title>
<style>
body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#16181d;margin:32px;font-size:12px}
h1{font-size:20px;margin:0 0 16px}
table{width:100%;border-collapse:collapse}
th,td{border-bottom:1px solid #d5d8e0;padding:6px 4px;text-align:left}
th{background:#eceef3}
.n{text-align:right;white-space:nowrap}
tfoot td{font-weight:700;border-top:2px solid #16181d}
.small{color:#555b66;font-size:10px;margin-top:24px}
</style></head><body>
<h1>${esc(fill(t.pdf.title, { month: monthLabel }))}</h1>
<table><thead><tr><th>${t.pdf.date}</th><th>${t.pdf.shift}</th><th>${t.pdf.hours}</th><th class="n">${t.pdf.duration}</th><th class="n">${t.pdf.gross}</th><th>${t.pdf.note}</th></tr></thead>
<tbody>${body}</tbody>
<tfoot>
<tr><td colspan="3">${t.pdf.total}</td><td class="n">${esc(formatHours(summary.hours, lang))}</td><td class="n">${esc(formatMoney(summary.gross, lang))}</td><td></td></tr>
${summary.premium > 0 ? `<tr><td colspan="4">${t.pdf.premium}</td><td class="n">${esc(formatMoney(summary.premium, lang))}</td><td></td></tr>` : ''}
<tr><td colspan="4">${esc(fill(t.pdf.net, { percent: formatNumber(charges, lang, 1) }))}</td><td class="n">${esc(formatMoney(net, lang))}</td><td></td></tr>
</tfoot></table>
<p class="small">${t.pdf.footer}</p>
</body></html>`;
}

export async function exportPdf(year: number, month0: number): Promise<void> {
  const html = timesheetHtml(year, month0);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareFileUri(uri, 'application/pdf', 'com.adobe.pdf');
}

/** CSV au format Excel français : séparateur « ; », virgule décimale, BOM UTF-8. */
export function timesheetCsv(year: number, month0: number): string {
  const { t, lang } = currentI18n();
  const { rows, summary } = monthRows(year, month0);
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const num = (n: number) => formatNumber(n, lang, 2).replace(/\s/g, '');
  const sep = lang === 'fr' ? ';' : ',';
  const lines = [
    [t.pdf.date, t.pdf.shift, t.pdf.hours, t.pdf.duration, t.pdf.gross, t.pdf.note]
      .map(q)
      .join(sep),
    ...rows.map((r) =>
      [q(r.date), q(r.shift), q(r.times), q(num(r.rawHours)), q(num(r.rawGross)), q(r.note)].join(
        sep,
      ),
    ),
    [q(t.pdf.total), q(''), q(''), q(num(summary.hours)), q(num(summary.gross)), q('')].join(sep),
  ];
  return `﻿${lines.join('\r\n')}\r\n`;
}

export async function exportCsv(year: number, month0: number): Promise<void> {
  const name = `feuille-heures-${year}-${String(month0 + 1).padStart(2, '0')}.csv`;
  await shareTextFile(
    name,
    timesheetCsv(year, month0),
    'text/csv',
    'public.comma-separated-values-text',
  );
}
