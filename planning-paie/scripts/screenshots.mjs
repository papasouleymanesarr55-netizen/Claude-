// Captures d'écran de la version web exportée (npx expo export --platform web).
// Usage : node scripts/screenshots.mjs [dossier-dist] [dossier-sortie]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { demoState } from './demo-data.mjs';

// Playwright est installé globalement dans l'environnement de capture.
const { chromium } = createRequire(import.meta.url)('playwright');

const dist = resolve(process.argv[2] ?? 'dist');
const out = resolve(process.argv[3] ?? 'scripts/out');
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

async function shot(name, { theme = 'light', premium = false, path = '/', act, state } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: Number(process.env.SCALE ?? 1),
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
  await page.clock.setFixedTime(new Date('2026-10-16T09:00:00+02:00'));
  const value = state === undefined ? demoState({ theme, premium }) : state;
  await page.addInitScript((v) => {
    if (v !== null) localStorage.setItem('planning-paie', v);
  }, value);
  await page.goto(base + path);
  await page.waitForTimeout(1200);
  if (act) await act(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, `${name}.png`) });
  await ctx.close();
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

await browser.close();
server.close();
if (errors.length) {
  console.error('Erreurs :\n' + errors.join('\n'));
  process.exitCode = 1;
} else console.log('Captures enregistrées dans', out);
