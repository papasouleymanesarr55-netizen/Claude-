import { expect, isMobile, test } from './fixtures';

const REPUBLIQUE = { latitude: 48.8676, longitude: 2.3635 };

test.describe('géolocalisation accordée', () => {
  test.use({ geolocation: REPUBLIQUE, permissions: ['geolocation'] });

  test('centre la recherche sur la position et affiche « vous êtes ici »', async ({
    page,
    viewport,
  }) => {
    await page.goto('/');
    if (isMobile(viewport?.width))
      await page.getByRole('button', { name: 'Afficher la liste' }).click();
    await page.getByRole('button', { name: 'Utiliser ma position' }).click();
    await expect(page.getByText('Votre position')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actualiser ma position' })).toBeVisible();
    const map = page.getByRole('region', { name: 'Carte des services automobiles' });
    test.skip(await page.getByText('Carte indisponible').isVisible(), 'WebGL indisponible');
    await expect(map.getByRole('img', { name: 'Vous êtes ici' })).toBeAttached();
  });
});

test.describe('géolocalisation refusée', () => {
  test.use({ permissions: [] });

  test('explique le refus sans perdre les résultats', async ({ page, viewport }) => {
    await page.goto('/');
    if (isMobile(viewport?.width))
      await page.getByRole('button', { name: 'Afficher la liste' }).click();
    await page.getByRole('button', { name: 'Utiliser ma position' }).click();
    await expect(page.getByRole('alert')).toContainText('Géolocalisation refusée');
    await expect(page.getByRole('article').first()).toBeAttached();
  });
});

test('déplacer la carte propose « Rechercher dans cette zone »', async ({ page }) => {
  await page.goto('/');
  const map = page.getByRole('region', { name: 'Carte des services automobiles' });
  await expect(map).toBeVisible();
  test.skip(await page.getByText('Carte indisponible').isVisible(), 'WebGL indisponible');
  await expect(page.locator('.map-pin').first()).toBeAttached();
  const box = await map.boundingBox();
  if (!box) throw new Error('Carte sans dimensions');
  // Le geste part d'une zone sans marqueur (le centre est occupé par une borne).
  const x = box.x + box.width * 0.85;
  const y = box.y + box.height * 0.3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - box.width * 0.35, y + 10, { steps: 10 });
  await page.mouse.move(x - box.width * 0.7, y + 20, { steps: 10 });
  await page.mouse.up();
  const button = page.getByRole('button', { name: 'Rechercher dans cette zone' });
  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toBeHidden();
});
