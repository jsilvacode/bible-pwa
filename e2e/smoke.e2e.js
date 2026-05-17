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
  await page.getByRole('button', { name: '×' }).click();

  await page.getByRole('link', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Buscar' }).click();
  const searchInput = page.locator('#search-modal-input');
  await searchInput.fill('juan 3:16');
  await searchInput.press('Enter');
  await expect(page).toHaveURL(/\/read\/43\/3\/16/);
});
