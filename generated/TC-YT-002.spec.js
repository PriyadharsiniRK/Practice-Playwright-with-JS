// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-002
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-002 - Verify YouTube homepage', async ({ page }) => {
  // Precondition: User has internet access.

  // Step 1: Open https://www.youtube.com
  await page.goto('https://www.youtube.com');

  // Step 2: Verify that the YouTube logo is visible
  await expect(page.getByRole('link', { name: /youtube home/i })).toBeVisible();

  // Step 3: Verify that the search box is visible
  await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();

  // Step 4: Verify that the page title contains "YouTube"
  await expect(page).toHaveTitle(/YouTube/i);
});
