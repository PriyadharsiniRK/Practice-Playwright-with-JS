// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-007
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-007 - Return to the homepage using the logo', async ({ page }) => {
  // Precondition: User has internet access.

  // Step 1: Open https://www.youtube.com
  await page.goto('http://127.0.0.1:4173/');

  // Step 2: Enter "Playwright automation" in the search box
  await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');

  // Step 3: Click the Search button
  await page.getByRole('button', { name: /^search$/i }).click();

  // Step 4: Verify that search results are displayed
  await expect(page.locator('ytd-search')).toBeVisible();

  // Step 5: Click the YouTube logo
  await page.getByRole('link', { name: /youtube home/i }).click();

  // Step 6: Verify that the page title contains "YouTube"
  await expect(page).toHaveTitle(/YouTube/i);

  // Step 7: Verify that the search box is visible
  await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
});
