// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-014
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-014 - Search with no results', async ({ page }, testInfo) => {
  // The live site can show a cookie consent dialog; dismiss it whenever it appears.
  await page.addLocatorHandler(
    page.locator('ytd-consent-bump-v2-lightbox button').filter({ hasText: /reject all|accept all/i }).first(),
    (button) => button.click(),
  );
  // The live site can show a cookie consent page; dismiss it whenever it appears.
  await page.addLocatorHandler(
    page.locator('form[action*="consent.youtube.com"] button').filter({ hasText: /reject all|accept all/i }).first(),
    (button) => button.click(),
  );

  // Precondition: User has internet access.

  await test.step('Step 1: Open https://www.youtube.com', async () => {
    await page.goto('https://www.youtube.com');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Enter "zzqqxx no such video" in the search box', async () => {
    await page.getByRole('combobox', { name: /search/i }).fill('zzqqxx no such video');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Press Enter', async () => {
    await page.keyboard.press('Enter');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify that the no results message is visible', async () => {
    await expect(page.locator('.no-results')).toBeVisible();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that the first search result is not visible', async () => {
    await expect(page.locator('ytd-video-renderer').first()).toBeHidden();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
