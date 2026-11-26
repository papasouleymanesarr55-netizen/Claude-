// Captures d'écran de la version web exportée (npx expo export --platform web).
// Usage : node scripts/screenshots.mjs [dossier-dist] [dossier-sortie]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { demoState } from './demo-data.mjs';

// Playwright est installé globalement dans l'environnement de capture.
const { chromium } = createRequire(import.meta.url)('playwright');

// MODE=ios : 1290 × 2796 (iPhone 6,7 pouces) ; MODE=android : 1080 × 2400 ; sinon aperçu.
const MODE = process.env.MODE ?? 'preview';
const VIEW = {
  ios: { width: 430, height: 932, scale: 3 },
  android: { width: 360, height: 800, scale: 3 },
  preview: { width: 430, height: 932, scale: Number(process.env.SCALE ?? 1) },
}[MODE];
const dist = resolve(process.argv[2] ?? 'dist');
const out = resolve(
  process.argv[3] ?? (MODE === 'preview' ? 'scripts/out' : `store/screenshots/${MODE}`),
);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(dist, path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    file = join(dist, 'index.html');
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(await readFile(file));
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];

async function shot(
  name,
  { theme = 'light', premium = false, path = '/', act, state, rules, fullPage = false } = {},
) {
  const ctx = await browser.newContext({
    viewport: { width: VIEW.width, height: VIEW.height },
    deviceScaleFactor: VIEW.scale,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
  await page.clock.setFixedTime(new Date('2026-10-16T09:00:00+02:00'));
  const value = state === undefined ? demoState({ theme, premium }, rules) : state;
  await page.addInitScript((v) => {
    if (v !== null) localStorage.setItem('planning-paie', v);
  }, value);
  await page.goto(base + path);
  await page.waitForTimeout(1200);
  if (act) await act(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage });
  await ctx.close();
}

const openDay = async (p) => {
  await p.getByTestId('day-2026-10-16').click();
  await p.getByTestId('day-2026-10-16').click();
};
const editShift = async (p) => {
  await p.getByTestId('edit-toggle').click();
  await p.getByTestId('chip-Matin').click();
};

if (MODE !== 'preview') {
  await shot('1-planning-du-mois');
  await shot('2-modifier-un-jour', { act: openDay });
  await shot('3-poste-et-taux-horaire', { act: editShift });
  await shot('4-heures-sup-majorations', {
    premium: true,
    rules: { enabled: true, night: { rate: 20, start: 1260, end: 360 }, sundayRate: 0 },
  });
  await shot('5-theme-sombre', { theme: 'dark' });
  await shot('6-recap-par-entreprise', { path: '/recap?y=2026&m=9', premium: true });
  await browser.close();
  server.close();
  console.log('Captures enregistrées dans', out);
  process.exit(errors.length ? 1 : 0);
}

await shot('01-mois');
await shot('02-fiche-jour', {
  act: async (p) => {
    await p.getByTestId('day-2026-10-16').click();
    await p.getByTestId('day-2026-10-16').click();
  },
});
await shot('03-poste', {
  act: async (p) => {
    await p.getByTestId('edit-toggle').click();
    await p.getByTestId('chip-Matin').click();
  },
});
await shot('04-sombre', { theme: 'dark' });
await shot('05-reglages', { path: '/settings', premium: true });
await shot('06-premium', { path: '/premium' });
await shot('07-calcul-avance', { path: '/rules', premium: true });
await shot('08-bienvenue', { state: null });
await shot('09-recap', { path: '/recap?y=2026&m=9' });
await shot('11-facture', {
  path: '/recap?y=2026&m=9',
  premium: true,
  act: async (p) => {
    await p.getByTestId('invoice-Boulangerie Martin').click();
    await p.getByText('Facture', { exact: true }).click();
  },
});
await shot('12-reglages-complets', { path: '/settings', premium: true, fullPage: true });
await shot('13-coordonnees', { path: '/billing', premium: true });
await shot('10-recap-sombre', { path: '/recap?y=2026&m=9', theme: 'dark', premium: true });

await browser.close();
server.close();
if (errors.length) {
  console.error('Erreurs :\n' + errors.join('\n'));
  process.exitCode = 1;
} else console.log('Captures enregistrées dans', out);
