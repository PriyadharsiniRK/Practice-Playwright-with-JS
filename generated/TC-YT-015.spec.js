// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-015
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-015 - Clear search text', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

  await test.step('Step 1: Open https://www.youtube.com', async () => {
    await page.goto('http://127.0.0.1:4173/');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Enter "Playwright automation" in the search box', async () => {
    await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Clear the search box', async () => {
    await page.getByRole('combobox', { name: /search/i }).clear();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify that the search box is visible', async () => {
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
