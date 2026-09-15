// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-006
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-006 - Open a video and verify its details', async ({ page }) => {
  // Precondition: User has internet access.

  // Step 1: Open https://www.youtube.com
  await page.goto('https://www.youtube.com');

  // Step 2: Enter "Playwright automation" in the search box
  await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');

  // Step 3: Press Enter
  await page.keyboard.press('Enter');

  // Step 4: Click the first search result
  await page.locator('ytd-video-renderer').first().click();

  // Step 5: Verify that the video page is displayed
  await expect(page).toHaveURL(/\/watch/i);

  // Step 6: Verify that the video player is visible
  await expect(page.locator('#movie_player')).toBeVisible();

  // Step 7: Verify that the video title contains "Playwright"
  await expect(page.locator('h1.ytd-watch-metadata')).toContainText(/Playwright/i);
});
