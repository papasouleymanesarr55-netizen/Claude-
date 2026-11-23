import { expect, isMobile, test } from './fixtures';

const routes = [
  '/',
  '/explorer',
  '/recharge',
  '/parkings',
  '/services',
  '/favoris',
  '/vehicules',
  '/compte',
  '/abonnement',
  '/inconnue',
];

test('toutes les pages se chargent sans erreur ni défilement horizontal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  for (const path of routes) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).not.toBeEmpty();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, `défilement horizontal sur ${path}`).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('les données de démonstration sont clairement identifiées', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('status').filter({ hasText: 'Données de démonstration' }),
  ).toBeVisible();
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(15);
  for (const card of await cards.all()) {
    await expect(card.getByText('Démo', { exact: true })).toHaveCount(1);
  }
  await expect(
    page.getByRole('button', { name: 'Itinéraire disponible avec les données réelles' }).first(),
  ).toBeDisabled();
});

test('filtrer par catégorie met à jour la liste et la carte', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('group', { name: 'Filtrer par catégorie' })
    .getByRole('button', { name: 'Parking' })
    .click();
  await expect(page).toHaveURL(/cat=parking/);
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.locator('.map-pin')).toHaveCount(3);
});

test('la recherche filtre les établissements', async ({ page, viewport }) => {
  await page.goto('/');
  if (isMobile(viewport?.width)) await page.getByRole('button', { name: 'Rechercher' }).click();
  await page.getByRole('combobox').fill('bastille');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText('Borne démo · Bastille');
});

test('sélectionner un marqueur met en avant l’établissement', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Parking démo · Temple' }).first().click();
  await expect(page).toHaveURL(/place=demo-pk-temple/);
  await expect(page.locator('[data-place-id="demo-pk-temple"]')).toHaveAttribute(
    'aria-current',
    'true',
  );
});

test('ajouter un favori le retrouve dans « Mes favoris »', async ({ page, viewport }) => {
  await page.goto('/');
  if (isMobile(viewport?.width))
    await page.getByRole('button', { name: 'Afficher la liste' }).click();
  await page
    .locator('[data-place-id="demo-ch-canal"]')
    .getByRole('button', { name: 'Ajouter aux favoris' })
    .click();
  await page
    .getByRole('link', { name: /favoris/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/favoris$/);
  await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Mes favoris');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText('Borne démo · Canal');
  await expect(page.getByRole('button', { name: 'Mon véhicule' })).toHaveCount(0);
});

test('navigation principale', async ({ page, viewport }) => {
  await page.goto('/');
  if (isMobile(viewport?.width)) {
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    await nav.getByRole('link', { name: 'Recharge' }).click();
  } else {
    await page
      .getByRole('navigation', { name: 'Navigation' })
      .getByRole('link', { name: 'Bornes de recharge' })
      .click();
  }
  await expect(page).toHaveURL(/\/recharge$/);
  await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Bornes de recharge');
  await expect(page.getByRole('article').first()).toBeAttached();
});

test('le panneau véhicule est accessible à chaque format', async ({ page, viewport }) => {
  await page.goto('/');
  const width = viewport?.width ?? 1280;
  if (width >= 1280) {
    await expect(page.getByRole('complementary', { name: 'Mon véhicule' })).toContainText(
      'Véhicule de démonstration',
    );
  } else {
    await page.getByRole('button', { name: 'Mon véhicule' }).click();
    const drawer = page.getByRole('dialog', { name: 'Véhicule et raccourcis' });
    await expect(drawer).toContainText('Véhicule de démonstration');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Mon véhicule' })).toBeVisible();
  }
});

test('mobile : le panneau de liste se déplie', async ({ page, viewport }) => {
  test.skip(!isMobile(viewport?.width), 'mobile uniquement');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Afficher la liste' });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Réduire la liste' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
});

test('l’attribution OpenFreeMap / OpenMapTiles / OpenStreetMap est visible et non masquée', async ({
  page,
}) => {
  await page.goto('/');
  const map = page.getByRole('region', { name: 'Carte des services automobiles' });
  await expect(map).toBeVisible();
  test.skip(
    await page.getByText('Carte indisponible').isVisible(),
    'WebGL indisponible dans ce navigateur',
  );
  const attribution = page.locator('.maplibregl-ctrl-attrib');
  await expect(attribution).toBeVisible();
  for (const name of ['OpenFreeMap', '© OpenMapTiles', 'OpenStreetMap']) {
    await expect(attribution.getByRole('link', { name })).toBeVisible();
  }
  await expect(attribution.getByRole('link', { name: 'OpenStreetMap' })).toHaveAttribute(
    'href',
    'https://www.openstreetmap.org/copyright',
  );
  // Aucun autre élément (panneau mobile, navigation, marqueur…) ne recouvre le lien OpenStreetMap.
  const osm = attribution.getByRole('link', { name: 'OpenStreetMap' });
  await expect
    .poll(async () => {
      const box = await osm.boundingBox();
      if (!box) return 'sans dimensions';
      return page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('.maplibregl-ctrl-attrib') != null,
        { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      );
    })
    .toBe(true);
});
