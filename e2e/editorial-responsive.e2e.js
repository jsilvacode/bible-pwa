import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= window.innerWidth
  ))).toBe(true);
}

test('la exploración y el selector se mantienen contenidos a 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Buenos días|Buenas (?:tardes|noches)/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const selector = page.locator('header select');
  const selectorBox = await selector.boundingBox();
  expect((selectorBox?.x ?? 0) + (selectorBox?.width ?? 0)).toBeLessThanOrEqual(320);

  const categoryCards = page.locator('button[aria-label^="Explorar"]');
  const count = await categoryCards.count();
  for (let index = 0; index < count; index += 1) {
    const box = await categoryCards.nth(index).boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  }

  await page.getByRole('button', { name: /Explorar Antiguo Testamento/ }).click();
  await expect(page).toHaveURL(/\/bible$/);
  await expectNoHorizontalOverflow(page);
});

test('la presentación bíblica limpia marcas de origen sin alterar el texto', async ({ page }) => {
  await page.goto('/read/1/3');
  const verse = page.locator('#verse-15');

  await expect(verse).toContainText('«Pondré enemistad');
  await expect(verse).not.toContainText('-»');
  await expect(verse).toContainText('Él te herirá');
});
