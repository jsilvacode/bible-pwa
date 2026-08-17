import { expect, test } from '@playwright/test';

test('smoke flow: version, navigation, CBA, search', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('PAN DE VIDA')).toBeVisible();

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

test('inicio prioriza búsqueda y acceso directo a los testamentos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByText('COMENTARIO BÍBLICO ADVENTISTA:')).toHaveCount(0);
  await expect(page.getByText('Cargando versículo...')).toHaveCount(0);

  const readChapter = page.getByRole('button', { name: 'Leer capítulo completo' });
  const homeSearch = page.getByRole('searchbox', { name: 'Buscar en la Santa Biblia' });
  const searchBox = await homeSearch.boundingBox();
  const readChapterBox = await readChapter.boundingBox();
  expect(searchBox?.y).toBeGreaterThan(
    (readChapterBox?.y ?? 0) + (readChapterBox?.height ?? 0)
  );

  const oldTestament = page.getByRole('button', { name: /Antiguo Testamento/ });
  const newTestament = page.getByRole('button', { name: /Nuevo Testamento/ });
  await expect(oldTestament).toBeVisible();
  await expect(newTestament).toBeVisible();

  await newTestament.click();
  await expect(page).toHaveURL(/\/bible$/);
  await expect(page.getByRole('button', { name: /Nuevo Testamento Colapsar/ })).toBeVisible();
  await expect(page.locator('button', { hasText: 'Mateo' }).first()).toBeVisible();
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

test('la búsqueda limita consultas masivas sin saturar el DOM', async ({ page }) => {
  await page.goto('/read/43/3');
  await expect(page.getByRole('heading', { name: /Juan 3/ })).toBeVisible();

  await page.getByLabel('Herramientas de lectura').getByRole('button', { name: 'Buscar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Buscar' });
  await dialog.getByRole('textbox', { name: 'Buscar en la Santa Biblia' }).fill('Dios');
  await dialog.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(dialog.getByText('Mostrando los primeros 100 resultados.')).toBeVisible();
});

test('herramientas de lectura se adaptan a móvil y tablet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/read/43/3');
  await expect(page.getByRole('heading', { name: /Juan 3/ })).toBeVisible();

  const dock = page.getByLabel('Herramientas de lectura');
  const readerSearch = page.getByRole('button', { name: 'Buscar', exact: true });
  const quickSettings = page.getByRole('button', { name: 'Ajustes rápidos' });

  await expect(dock).toHaveCSS('flex-direction', 'row');
  await expect(dock).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(dock).toHaveCSS('border-top-style', 'none');
  const searchBox = await readerSearch.boundingBox();
  const settingsBox = await quickSettings.boundingBox();
  expect(searchBox?.x).toBeLessThan(settingsBox?.x ?? 0);

  await readerSearch.focus();
  await expect(page.getByRole('tooltip', { name: 'Buscar' })).toBeHidden();

  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(dock).toHaveCSS('flex-direction', 'row');
  await quickSettings.focus();
  await expect(page.getByRole('tooltip', { name: 'Ajustes rápidos' })).toBeHidden();

  const chapterNavigation = page.getByRole('navigation', { name: 'Navegación de capítulos' });
  const bottomNavigation = page.getByRole('navigation', { name: 'Navegación principal' });

  await page.evaluate(() => window.scrollTo(0, 300));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(299);
  await page.waitForTimeout(3200);
  await expect(dock).toBeHidden();
  await expect(bottomNavigation).toHaveCSS('opacity', '0');

  await page.mouse.move(120, 120);
  await expect(dock).toBeVisible();
  await expect(bottomNavigation).toHaveCSS('opacity', '1');

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(dock).toBeHidden();
  await expect(bottomNavigation).toHaveCSS('opacity', '1');

  const chapterNavigationBox = await chapterNavigation.boundingBox();
  const bottomNavigationBox = await bottomNavigation.boundingBox();
  const footerGap = (bottomNavigationBox?.y ?? 0)
    - ((chapterNavigationBox?.y ?? 0) + (chapterNavigationBox?.height ?? 0));
  expect(footerGap).toBeGreaterThanOrEqual(20);
  expect(footerGap).toBeLessThanOrEqual(48);

  await page.waitForTimeout(3200);
  await expect(dock).toBeHidden();
  await expect(bottomNavigation).toHaveCSS('opacity', '1');

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(dock).toBeVisible();
  await expect(bottomNavigation).toHaveCSS('opacity', '1');
});

test('una segunda pulsación en Inicio vuelve arriba', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Buenos días|Buenas (?:tardes|noches)/ })
  ).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.getByRole('link', { name: 'Inicio' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
