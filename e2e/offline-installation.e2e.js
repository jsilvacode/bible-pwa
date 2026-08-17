import { expect, test } from '@playwright/test';

test('una instalación prepara Biblia y comentario para una recarga sin conexión', async ({ page, context }) => {
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      if (query === '(display-mode: standalone)') {
        return {
          matches: true,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        };
      }
      return nativeMatchMedia(query);
    };
  });

  await page.goto('/read/1/1');
  await expect(page.getByRole('heading', { name: /Génesis 1/ })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);

  await expect.poll(async () => page.evaluate(async () => {
    const bible = await caches.open('santa-biblia-library-bible-nbla-v1');
    const commentary = await caches.open('santa-biblia-library-commentary-v1');
    return {
      bible: (await bible.keys()).length,
      commentary: (await commentary.keys()).length,
    };
  }), { timeout: 120_000 }).toEqual({ bible: 1189, commentary: 1189 });

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: /Génesis 1/ })).toBeVisible();
  await expect(page.locator('#verse-1')).toContainText('En el principio');

  await page.locator('#verse-1').click();
  await page.getByRole('button', { name: /Ver Comentario \(CBA\)/i }).click();
  await expect(page.getByRole('heading', { name: 'Comentario Bíblico' })).toBeVisible();
});
