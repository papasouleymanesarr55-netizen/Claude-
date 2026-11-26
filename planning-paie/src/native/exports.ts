import { format } from 'date-fns';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

import { exportBackup } from '../domain/backup';
import { computeMonth, netFrom, resolveDay } from '../domain/calc';
import { formatHours, formatMoney, formatNumber } from '../domain/format';
import { recapByEmployer } from '../domain/recap';
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
      billing: s.billing,
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

/** Récapitulatif du mois par entreprise, à partir de l'état courant. */
export function monthRecap(year: number, month0: number) {
  const s = useAppStore.getState();
  const { t, locale } = currentI18n();
  const summary = computeMonth(
    { shifts: s.shifts, days: s.days, rules: s.rules, advanced: selectPremium(s) },
    year,
    month0,
  );
  const recap = recapByEmployer(summary, s.shifts, s.days, s.settings.charges, t.day.customShift);
  const monthLabel = format(new Date(year, month0, 1), 'LLLL yyyy', { locale });
  return {
    recap,
    charges: s.settings.charges,
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
  };
}

export function recapHtml(year: number, month0: number): string {
  const { t, lang, locale } = currentI18n();
  const { recap, charges, monthLabel } = monthRecap(year, month0);
  const title = fill(t.recap.pdfTitle, { month: monthLabel });
  const money = (n: number) => esc(formatMoney(n, lang));
  const hours = (n: number) => esc(formatHours(n, lang));
  const name = (e: string) => esc(e || t.recap.noEmployer);

  const overview = recap.employers
    .map(
      (e) =>
        `<tr><td>${name(e.employer)}</td><td class="n">${e.daysWorked}</td><td class="n">${hours(e.hours)}</td><td class="n">${money(e.gross)}</td><td class="n">${money(e.net)}</td></tr>`,
    )
    .join('');

  const sections = recap.employers
    .map((e) => {
      const rows = e.days
        .map(
          (d) =>
            `<tr><td>${esc(format(parseDayKey(d.day.key), 'EEE d MMM', { locale }))}</td><td>${esc(d.day.shift?.name ?? t.day.customShift)}</td><td>${toHHMM(d.day.start)}–${toHHMM(d.day.end)}${d.day.pause ? ` (−${d.day.pause} min)` : ''}</td><td class="n">${hours(d.hours)}</td><td class="n">${money(d.gross)}</td><td>${esc(d.day.note ?? '')}</td></tr>`,
        )
        .join('');
      const lines = e.lines
        .map(
          (l) =>
            `${esc(fill(t.recap.shiftLine, { name: l.label, count: l.count }))} : ${hours(l.hours)} · ${money(l.gross)}`,
        )
        .join(' &nbsp;|&nbsp; ');
      return `<h2>${name(e.employer)}</h2>
<p class="muted">${lines}</p>
<table><thead><tr><th>${t.pdf.date}</th><th>${t.pdf.shift}</th><th>${t.pdf.hours}</th><th class="n">${t.pdf.duration}</th><th class="n">${t.pdf.gross}</th><th>${t.pdf.note}</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="3">${esc(fill(t.recap.subtotal, { name: e.employer || t.recap.noEmployer }))}</td><td class="n">${hours(e.hours)}</td><td class="n">${money(e.gross)}</td><td></td></tr>
${e.premium > 0 ? `<tr><td colspan="4">${t.pdf.premium}</td><td class="n">${money(e.premium)}</td><td></td></tr>` : ''}
<tr><td colspan="4">${esc(fill(t.pdf.net, { percent: formatNumber(charges, lang, 1) }))}</td><td class="n">${money(e.net)}</td><td></td></tr></tfoot></table>`;
    })
    .join('');

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#16181d;margin:32px;font-size:12px}
h1{font-size:20px;margin:0 0 16px}h2{font-size:16px;margin:28px 0 4px;page-break-after:avoid}
table{width:100%;border-collapse:collapse;page-break-inside:auto}
th,td{border-bottom:1px solid #d5d8e0;padding:6px 4px;text-align:left}
th{background:#eceef3}.n{text-align:right;white-space:nowrap}
tfoot td{font-weight:700}.grand td{font-weight:800;border-top:2px solid #16181d;font-size:13px}
.muted{color:#555b66;margin:0 0 8px}.small{color:#555b66;font-size:10px;margin-top:24px}
</style></head><body>
<h1>${esc(title)}</h1>
<table><thead><tr><th>${t.recap.employer}</th><th class="n">${t.recap.days}</th><th class="n">${t.recap.hours}</th><th class="n">${t.recap.gross}</th><th class="n">${t.recap.net}</th></tr></thead>
<tbody>${overview}</tbody>
<tfoot><tr class="grand"><td>${t.recap.total}</td><td class="n">${recap.total.daysWorked}</td><td class="n">${hours(recap.total.hours)}</td><td class="n">${money(recap.total.gross)}</td><td class="n">${money(recap.total.net)}</td></tr></tfoot></table>
${sections}
<p class="small">${esc(fill(t.pdf.net, { percent: formatNumber(charges, lang, 1) }))}. ${t.pdf.footer}</p>
</body></html>`;
}

/** CSV du récapitulatif : une ligne par jour avec l'entreprise, sous-totaux puis total. */
export function recapCsv(year: number, month0: number): string {
  const { t, lang, locale } = currentI18n();
  const { recap } = monthRecap(year, month0);
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const num = (n: number) => formatNumber(n, lang, 2).replace(/\s/g, '');
  const sep = lang === 'fr' ? ';' : ',';
  const row = (cells: string[]) => cells.map(q).join(sep);
  const lines = [
    row([
      t.recap.employer,
      t.pdf.date,
      t.pdf.shift,
      t.pdf.hours,
      t.pdf.duration,
      t.pdf.gross,
      t.recap.net,
      t.pdf.note,
    ]),
  ];
  for (const e of recap.employers) {
    const emp = e.employer || t.recap.noEmployer;
    for (const d of e.days) {
      lines.push(
        row([
          emp,
          format(parseDayKey(d.day.key), 'dd/MM/yyyy', { locale }),
          d.day.shift?.name ?? t.day.customShift,
          `${toHHMM(d.day.start)}-${toHHMM(d.day.end)}`,
          num(d.hours),
          num(d.gross),
          '',
          d.day.note ?? '',
        ]),
      );
    }
    lines.push(
      row([
        fill(t.recap.subtotal, { name: emp }),
        '',
        '',
        '',
        num(e.hours),
        num(e.gross),
        num(e.net),
        '',
      ]),
    );
  }
  lines.push(
    row([
      t.recap.total,
      '',
      '',
      '',
      num(recap.total.hours),
      num(recap.total.gross),
      num(recap.total.net),
      '',
    ]),
  );
  return `﻿${lines.join('\r\n')}\r\n`;
}

export async function exportRecapPdf(year: number, month0: number): Promise<void> {
  const html = recapHtml(year, month0);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareFileUri(uri, 'application/pdf', 'com.adobe.pdf');
}

export async function exportRecapCsv(year: number, month0: number): Promise<void> {
  const name = `recap-${year}-${String(month0 + 1).padStart(2, '0')}.csv`;
  await shareTextFile(
    name,
    recapCsv(year, month0),
    'text/csv',
    'public.comma-separated-values-text',
  );
}
