import { addDays, format } from 'date-fns';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

import { formatHours, formatMoney, formatNumber } from '../domain/format';
import { invoiceLines, type Issuer } from '../domain/invoice';
import type { EmployerRecap } from '../domain/recap';
import { parseDayKey, toHHMM } from '../domain/time';
import { currentI18n, fill } from '../i18n';
import { useAppStore } from '../store/store';
import { monthRecap } from './exports';
import { shareFileUri } from './files';

export type DocKind = 'statement' | 'invoice';

export interface DocRequest {
  kind: DocKind;
  /** Nom de l'entreprise ('' = sans entreprise). */
  employer: string;
  year: number;
  month0: number;
  number: string;
  clientAddress: string;
  issueDate: Date;
}

/** Une facture exige au minimum nom, adresse et SIRET de l'émetteur. */
export function issuerComplete(i: Issuer): boolean {
  return !!(i.name.trim() && i.address.trim() && i.siret.trim());
}

function esc(v: string): string {
  return v.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}
const multiline = (v: string) => esc(v).replace(/\n/g, '<br>');

const CSS = `body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#16181d;margin:36px;font-size:12px}
h1{font-size:22px;margin:0 0 4px}.muted{color:#555b66}
.parties{display:flex;gap:24px;margin:20px 0}.party{flex:1;border:1px solid #d5d8e0;border-radius:8px;padding:10px 12px}
.party h3{margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#555b66;letter-spacing:.5px}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border-bottom:1px solid #d5d8e0;padding:6px 4px;text-align:left}
th{background:#eceef3}.n{text-align:right;white-space:nowrap}
.totals{margin-left:auto;width:55%;margin-top:12px}.totals td{font-weight:700}.grand td{font-size:14px;border-top:2px solid #16181d}
.legal{font-size:10px;color:#555b66;margin-top:24px;line-height:1.5}
.sign{display:flex;gap:24px;margin-top:36px}.sign div{flex:1;border-top:1px solid #16181d;padding-top:6px;height:70px}`;

function findRecap(req: DocRequest): { recap: EmployerRecap | undefined; monthLabel: string } {
  const { recap, monthLabel } = monthRecap(req.year, req.month0);
  return { recap: recap.employers.find((e) => e.employer === req.employer), monthLabel };
}

export function documentHtml(req: DocRequest): string {
  const { t, lang, locale } = currentI18n();
  const { billing } = useAppStore.getState();
  const issuer = billing.issuer;
  const { recap, monthLabel } = findRecap(req);
  const money = (n: number) => esc(formatMoney(n, lang));
  const hours = (n: number) => esc(formatHours(n, lang));
  const date = (d: Date) => format(d, 'dd/MM/yyyy', { locale });
  const employerName = req.employer || t.recap.noEmployer;
  const days = recap?.days ?? [];

  const issuerBlock = [
    `<strong>${esc(issuer.name)}</strong>`,
    multiline(issuer.address),
    issuer.siret ? esc(fill(t.invoice.siret, { siret: issuer.siret })) : '',
    esc(issuer.email),
    esc(issuer.phone),
  ]
    .filter(Boolean)
    .join('<br>');
  const clientBlock = [`<strong>${esc(employerName)}</strong>`, multiline(req.clientAddress)]
    .filter(Boolean)
    .join('<br>');

  if (req.kind === 'statement') {
    const rows = days
      .map(
        (d) =>
          `<tr><td>${esc(format(parseDayKey(d.day.key), 'EEE dd/MM', { locale }))}</td><td>${esc(d.day.shift?.name ?? t.day.customShift)}</td><td>${toHHMM(d.day.start)}–${toHHMM(d.day.end)}</td><td class="n">${d.day.pause ? `${d.day.pause} min` : '—'}</td><td class="n">${hours(d.hours)}</td><td>${esc(d.day.note ?? '')}</td></tr>`,
      )
      .join('');
    const title = fill(t.invoice.statementTitle, { month: monthLabel });
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>
<h1>${esc(title)}</h1><div class="muted">${esc(fill(t.invoice.issuedOn, { date: date(req.issueDate) }))}</div>
<div class="parties"><div class="party"><h3>${t.invoice.employee}</h3>${issuer.name ? issuerBlock : '&nbsp;'}</div>
<div class="party"><h3>${t.invoice.employer}</h3>${clientBlock}</div></div>
<table><thead><tr><th>${t.pdf.date}</th><th>${t.pdf.shift}</th><th>${t.pdf.hours}</th><th class="n">${t.day.pause.replace(/ \(.*\)/, '')}</th><th class="n">${t.pdf.duration}</th><th>${t.pdf.note}</th></tr></thead>
<tbody>${rows}</tbody></table>
<table class="totals"><tr class="grand"><td>${t.invoice.totalHours}</td><td class="n">${hours(recap?.hours ?? 0)}</td></tr>
<tr><td>${t.invoice.estimated}</td><td class="n">${money(recap?.gross ?? 0)}</td></tr></table>
<div class="sign"><div>${t.invoice.signEmployee}</div><div>${t.invoice.signEmployer}</div></div>
<p class="legal">${t.pdf.footer}</p></body></html>`;
  }

  // Facture
  const lines = recap ? invoiceLines(recap, t.invoice.premiumLine) : [];
  const total = recap?.gross ?? 0;
  const body = lines
    .map((l) => {
      const label =
        l.hours === null
          ? l.label
          : l.label
            ? fill(t.invoice.service, { name: l.label, month: monthLabel })
            : fill(t.invoice.custom, { month: monthLabel });
      return `<tr><td>${esc(label)}</td><td class="n">${l.hours === null ? '' : esc(formatNumber(l.hours, lang, 2))}</td><td class="n">${l.rate === null ? '' : money(l.rate)}</td><td class="n">${money(l.amount)}</td></tr>`;
    })
    .join('');
  const due = addDays(req.issueDate, issuer.paymentDays);
  const title = fill(t.invoice.invoiceTitle, { number: req.number });
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>
<h1>${esc(title)}</h1>
<div class="muted">${esc(fill(t.invoice.issuedOn, { date: date(req.issueDate) }))} · ${esc(fill(t.invoice.period, { month: monthLabel }))} · ${esc(fill(t.invoice.dueOn, { date: date(due) }))}</div>
<div class="parties"><div class="party"><h3>${t.invoice.from}</h3>${issuerBlock}</div><div class="party"><h3>${t.invoice.to}</h3>${clientBlock}</div></div>
<table><thead><tr><th>${t.invoice.designation}</th><th class="n">${t.invoice.quantity}</th><th class="n">${t.invoice.unitPrice}</th><th class="n">${t.invoice.amount}</th></tr></thead>
<tbody>${body}</tbody></table>
<table class="totals"><tr><td>${t.invoice.totalHt}</td><td class="n">${money(total)}</td></tr>
<tr><td colspan="2" class="muted" style="font-weight:400">${esc(issuer.vatMention)}</td></tr>
<tr class="grand"><td>${t.invoice.totalDue}</td><td class="n">${money(total)}</td></tr></table>
<p class="legal">${issuer.iban ? `${esc(fill(t.invoice.iban, { iban: issuer.iban }))}<br>` : ''}${t.invoice.late}</p>
</body></html>`;
}

/** Crée le PDF et ouvre la feuille de partage ; une facture fait avancer la numérotation. */
export async function exportDocument(req: DocRequest): Promise<void> {
  const html = documentHtml(req);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
  } else {
    const { uri } = await Print.printToFileAsync({ html });
    await shareFileUri(uri, 'application/pdf', 'com.adobe.pdf');
  }
  const store = useAppStore.getState();
  if (req.employer) store.setClientAddress(req.employer, req.clientAddress);
  if (req.kind === 'invoice') store.recordInvoice(req.number);
}
