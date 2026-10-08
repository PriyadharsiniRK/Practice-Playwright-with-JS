// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-010
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-010 - The homepage shows no video player', async ({ page }, testInfo) => {
  // The live site can show a cookie consent dialog; dismiss it whenever it appears.
  await page.addLocatorHandler(page.locator('ytd-consent-bump-v2-lightbox').first(), async () => {
    await page.locator('ytd-consent-bump-v2-lightbox button').filter({ hasText: /reject all|accept all/i }).first().click();
  });
  // The live site can show a cookie consent page; dismiss it whenever it appears.
  await page.addLocatorHandler(page.locator('form[action*="consent.youtube.com"]').first(), async () => {
    await page.locator('form[action*="consent.youtube.com"] button').filter({ hasText: /reject all|accept all/i }).first().click();
  });

  // Precondition: User has internet access.

  await test.step('Step 1: Open https://www.youtube.com', async () => {
    await page.goto('https://www.youtube.com');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Verify that the YouTube logo is visible', async () => {
    await expect(page.getByRole('link', { name: /youtube home/i })).toBeVisible();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Verify that the video player is not visible', async () => {
    await expect(page.locator('#movie_player')).toBeHidden();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
