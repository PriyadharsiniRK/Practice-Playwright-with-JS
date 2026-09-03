// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-003
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-003 - Search and open a video', async ({ page }) => {
  // Precondition: User has internet access.

  // Step 1: Open https://www.youtube.com
  await page.goto('https://www.youtube.com');

  // Step 2: Enter "Playwright testing tutorial" in the search box
  await page.getByRole('combobox', { name: /search/i }).fill('Playwright testing tutorial');

  // Step 3: Press Enter
  await page.keyboard.press('Enter');

  // Step 4: Verify that search results are displayed
  await expect(page.locator('ytd-search')).toBeVisible();

  // Step 5: Click the first search result
  await page.locator('ytd-video-renderer').first().click();

  // Step 6: Verify that the video player is visible
  await expect(page.locator('#movie_player')).toBeVisible();

  // Step 7: Verify that the page title contains "YouTube"
  await expect(page).toHaveTitle(/YouTube/i);
});
