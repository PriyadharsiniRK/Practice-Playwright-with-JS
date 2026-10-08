// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-002
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-002 - Verify YouTube homepage', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

  await test.step('Step 1: Open https://www.youtube.com', async () => {
    await page.goto('https://www.youtube.com');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Close the cookie consent dialog if it is displayed', async () => {
    const closeButton = page.locator('ytd-consent-bump-v2-lightbox button, form[action*="consent.youtube.com"] button').filter({ hasText: /reject all|accept all|alle ablehnen|alle akzeptieren|tout refuser|tout accepter|rechazar todo|aceptar todo|rifiuta tutto|accetta tutto|alles afwijzen|alles accepteren|avvisa alla|godkänn alla|afvis alle|accepter alle|avvis alle|godta alle|hylkää kaikki|hyväksy kaikki|odrzuć wszystko|zaakceptuj wszystko|rejeitar tudo|aceitar tudo/i }).first();
    if (await closeButton.waitFor({ timeout: 10_000 }).then(() => true, () => false)) {
      await closeButton.click();
      await closeButton.waitFor({ state: 'hidden' });
    }
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Verify that the YouTube logo is visible', async () => {
    await expect(page.getByRole('link', { name: /youtube home/i })).toBeVisible();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify that the search box is visible', async () => {
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that the page title contains "YouTube"', async () => {
    await expect(page).toHaveTitle(/YouTube/i);
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
