// Génère les icônes et l'image de l'écran de lancement à partir d'un dessin SVG.
// Usage : node scripts/icons.mjs
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const BLUE = '#2348C4';

/** Symbole : calendrier avec une pastille « € ». `fg` = couleur du trait. */
function symbol(fg, accent) {
  return `
  <g>
    <rect x="232" y="292" width="560" height="500" rx="64" fill="none" stroke="${fg}" stroke-width="52"/>
    <rect x="232" y="292" width="560" height="140" rx="64" fill="${fg}"/>
    <rect x="232" y="380" width="560" height="52" fill="${fg}"/>
    <rect x="352" y="222" width="52" height="140" rx="26" fill="${fg}"/>
    <rect x="620" y="222" width="52" height="140" rx="26" fill="${fg}"/>
    <g fill="${fg}">
      <rect x="322" y="490" width="80" height="64" rx="14"/>
      <rect x="432" y="490" width="80" height="64" rx="14"/>
      <rect x="322" y="590" width="80" height="64" rx="14"/>
      <rect x="432" y="590" width="80" height="64" rx="14"/>
    </g>
    <circle cx="660" cy="640" r="150" fill="${accent}" stroke="${fg === '#FFFFFF' ? BLUE : '#FFFFFF'}" stroke-width="0"/>
    <text x="660" y="700" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="190"
      text-anchor="middle" fill="${accent === '#FFFFFF' ? BLUE : '#1b1b1b'}">€</text>
  </g>`;
}

const files = [
  // iOS / icône générale : fond plein, sans transparence.
  { name: 'icon.png', size: 1024, svg: `<rect width="1024" height="1024" fill="${BLUE}"/>${symbol('#FFFFFF', '#F5B700')}` },
  // Android adaptatif : premier plan transparent, symbole réduit dans la zone sûre (66 %).
  { name: 'android-icon-foreground.png', size: 1024, transparent: true, svg: `<g transform="translate(512 512) scale(0.62) translate(-512 -512)">${symbol('#FFFFFF', '#F5B700')}</g>` },
  { name: 'android-icon-monochrome.png', size: 1024, transparent: true, svg: `<g transform="translate(512 512) scale(0.62) translate(-512 -512)">${symbol('#FFFFFF', '#FFFFFF')}</g>` },
  { name: 'android-icon-background.png', size: 1024, svg: `<rect width="1024" height="1024" fill="${BLUE}"/>` },
  // Écran de lancement : symbole blanc sur fond transparent (fond bleu défini dans app.json).
  { name: 'splash-icon.png', size: 1024, transparent: true, svg: symbol('#FFFFFF', '#F5B700') },
  { name: 'favicon.png', size: 48, svg: `<rect width="1024" height="1024" rx="200" fill="${BLUE}"/>${symbol('#FFFFFF', '#F5B700')}` },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const f of files) {
  await page.setViewportSize({ width: f.size, height: f.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="${f.size}" height="${f.size}" viewBox="0 0 1024 1024">${f.svg}</svg></body></html>`,
  );
  await page.screenshot({ path: resolve('assets', f.name), omitBackground: !!f.transparent });
  console.log('assets/' + f.name);
}
await browser.close();
