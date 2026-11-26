// Génère le site public (GitHub Pages) et PRIVACY.md à partir de src/legal/*.json.
// Usage : node scripts/build-site.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const legal = JSON.parse(await readFile('src/legal/legal.json', 'utf8'));
const pub = JSON.parse(await readFile('src/legal/publisher.json', 'utf8'));
const fill = (s) =>
  s
    .replace(/\{\{EMAIL\}\}/g, pub.email)
    .replace(/\{\{EDITOR\}\}/g, pub.editor)
    .replace(/\{\{UPDATED\}\}/g, pub.updated);
const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const link = (s) => esc(s).replace(/(https:\/\/[^\s)]+)/g, '<a href="$1">$1</a>');

const css = `:root{--bg:#f4f5f8;--fg:#16181d;--muted:#555b66;--accent:#2348c4;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#0e1014;--fg:#f2f3f5;--muted:#aab0bc;--accent:#8fa8ff;--card:#1a1d23}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 -apple-system,system-ui,Segoe UI,Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:32px 16px 64px}
h1{font-size:28px;margin:0 0 8px}h2{font-size:19px;margin:28px 0 6px}
a{color:var(--accent)}nav{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;font-size:15px}
.card{background:var(--card);border-radius:14px;padding:16px 18px;margin-top:16px}.muted{color:var(--muted)}`;

function page(lang, title, body) {
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Planning Paie</title><style>${css}</style></head>
<body><main>
<nav><a href="index.html">Planning Paie</a><a href="privacy.html">Confidentialité</a><a href="terms.html">Conditions</a><a href="privacy-en.html">Privacy (EN)</a><a href="terms-en.html">Terms (EN)</a></nav>
${body}
</main></body></html>
`;
}

// Sections « publicité » : incluses seulement si adsEnabled vaut true dans publisher.json.
const keep = (s) => (pub.adsEnabled ? !s.onlyWithoutAds : !s.onlyWithAds);

function doc(lang, key) {
  const d = legal[lang][key];
  const body =
    `<h1>${esc(d.title)}</h1>` +
    d.sections
      .filter(keep)
      .map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((p) => `<p>${link(fill(p))}</p>`).join('')}`)
      .join('');
  return page(lang, d.title, body);
}

await mkdir('site', { recursive: true });
await writeFile('site/privacy.html', doc('fr', 'privacy'));
await writeFile('site/terms.html', doc('fr', 'terms'));
await writeFile('site/privacy-en.html', doc('en', 'privacy'));
await writeFile('site/terms-en.html', doc('en', 'terms'));
await writeFile(
  'site/index.html',
  page(
    'fr',
    'Planning Paie',
    `<h1>Planning Paie</h1>
<p>Le planning de vos postes et l’estimation de votre paie du mois, sans publicité et sans collecte de données.</p>
<div class="card"><p><strong>Saisie rapide :</strong> touchez un poste, le jour suivant est sélectionné. Double-touchez un jour pour le modifier.</p>
<p><strong>Paie :</strong> taux horaire brut, brut du mois, net estimé, numéros de semaine.</p>
<p class="muted">Estimation indicative, non contractuelle. Seule votre fiche de paie fait foi.</p></div>
<p>Contact : ${esc(pub.email)}</p>`,
  ),
);
await writeFile('site/.nojekyll', '');

const md = (lang, key) => {
  const d = legal[lang][key];
  return `# ${d.title}\n\n${d.sections
    .filter(keep)
    .map((s) => `## ${s.h}\n\n${s.p.map(fill).join('\n\n')}`)
    .join('\n\n')}\n`;
};
await writeFile(
  'PRIVACY.md',
  `<!-- Fichier généré par scripts/build-site.mjs à partir de src/legal/legal.json : ne pas modifier à la main. -->\n\n${md('fr', 'privacy')}\n---\n\n${md('en', 'privacy')}`,
);
await writeFile(
  'TERMS.md',
  `<!-- Fichier généré par scripts/build-site.mjs à partir de src/legal/legal.json : ne pas modifier à la main. -->\n\n${md('fr', 'terms')}\n---\n\n${md('en', 'terms')}`,
);
console.log('site/ et PRIVACY.md, TERMS.md générés');
