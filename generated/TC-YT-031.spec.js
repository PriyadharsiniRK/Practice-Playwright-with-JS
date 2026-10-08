// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-031
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-031 - Browser Back navigation', async ({ page }, testInfo) => {
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

  await test.step('Step 3: Enter "Playwright automation" in the search box', async () => {
    await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Press Enter', async () => {
    await page.keyboard.press('Enter');
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Click the first search result', async () => {
    await page.locator('ytd-video-renderer').first().click();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Verify that the video page is displayed', async () => {
    await expect(page).toHaveURL(/\/watch/i);
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Navigate back', async () => {
    await page.goBack();
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 8: Verify that the URL contains "/results"', async () => {
    await expect(page).toHaveURL(/\/results/i);
    await testInfo.attach('Step 8', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
