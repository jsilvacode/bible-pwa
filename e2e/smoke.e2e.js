import { expect, test } from '@playwright/test';

test('smoke flow: version, navigation, CBA, search', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('VERSÍCULO DEL DÍA')).toBeVisible();

  const versionSelect = page.locator('header select');
  await expect(versionSelect).toBeVisible();
  const optionCount = await versionSelect.locator('option').count();
  if (optionCount > 1) {
    const secondValue = await versionSelect.locator('option').nth(1).getAttribute('value');
    await versionSelect.selectOption(secondValue || undefined);
  }

  await page.getByRole('link', { name: 'Biblia' }).click();
  await expect(page).toHaveURL(/\/bible$/);

  await page.getByRole('button', { name: /Antiguo Testamento/i }).click();
  await page.locator('button', { hasText: 'Génesis' }).click();
  await page.locator('button', { hasText: '1' }).first().click();
  await expect(page).toHaveURL(/\/read\/1\/1/);

  await page.locator('[id^="verse-"]').first().click();
  await page.getByRole('button', { name: /Ver Comentario \(CBA\)/i }).click();
  await expect(page.getByRole('heading', { name: 'Comentario Bíblico' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await page.getByRole('link', { name: 'Inicio' }).click();
  const homeSearch = page.getByRole('searchbox', { name: 'Buscar en la Santa Biblia' });
  await expect(homeSearch).toBeVisible();
  await homeSearch.fill('juan 3:16');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/\/read\/43\/3\/16/);

  const readerSearch = page.getByRole('button', { name: 'Buscar', exact: true });
  await readerSearch.focus();
  await expect(page.getByRole('tooltip', { name: 'Buscar' })).toBeVisible();
  await readerSearch.click();
  await expect(page.getByRole('dialog', { name: 'Buscar' })).toBeVisible();
  await expect(page.locator('#search-modal-input')).toBeFocused();
  await page.getByRole('button', { name: 'Cerrar' }).click();

  const quickSettings = page.getByRole('button', { name: 'Ajustes rápidos' });
  await expect(quickSettings).toBeVisible();
  await quickSettings.focus();
  await expect(page.getByRole('tooltip', { name: 'Ajustes rápidos' })).toBeVisible();
});

test('copiar versículo incluye cita de origen y url', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/read/1/1');

  await expect(page.getByRole('heading', { name: /Génesis 1/ })).toBeVisible();
  await page.locator('#verse-1').waitFor();

  await page.evaluate(() => {
    const el = document.getElementById('verse-1');
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
  });

  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('Génesis 1:1');
  expect(clip).toContain('/read/1/1/1');
});

test('herramientas de lectura se adaptan a móvil y tablet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/read/43/3');
  await expect(page.getByRole('heading', { name: /Juan 3/ })).toBeVisible();

  const dock = page.getByLabel('Herramientas de lectura');
  const readerSearch = page.getByRole('button', { name: 'Buscar', exact: true });
  const quickSettings = page.getByRole('button', { name: 'Ajustes rápidos' });

  await expect(dock).toHaveCSS('flex-direction', 'column');
  const searchBox = await readerSearch.boundingBox();
  const settingsBox = await quickSettings.boundingBox();
  expect(searchBox?.y).toBeLessThan(settingsBox?.y ?? 0);

  await readerSearch.focus();
  await expect(page.getByRole('tooltip', { name: 'Buscar' })).toBeHidden();

  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(dock).toHaveCSS('flex-direction', 'row');
  await quickSettings.focus();
  await expect(page.getByRole('tooltip', { name: 'Ajustes rápidos' })).toBeHidden();
});
