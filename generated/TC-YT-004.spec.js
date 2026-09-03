// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-004
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-004 - Search, open a video and go back to the results', async ({ page }) => {
  // Precondition: User has internet access.

  // Step 1: Open https://www.youtube.com
  await page.goto('https://www.youtube.com');

  // Step 2: Enter "Playwright automation" in the search box
  await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');

  // Step 3: Click the Search button
  await page.getByRole('button', { name: /^search$/i }).click();

  // Step 4: Click the first search result
  await page.locator('ytd-video-renderer').first().click();

  // Step 5: Verify that the video page is displayed
  await expect(page).toHaveURL(/\/watch/i);

  // Step 6: Navigate back
  await page.goBack();

  // Step 7: Verify that the URL contains "/results"
  await expect(page).toHaveURL(/\/results/i);
});
