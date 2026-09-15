// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-005
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-005 - Search results match the query', async ({ page }) => {
  // Precondition: User has internet access.

  // Step 1: Open https://www.youtube.com
  await page.goto('https://www.youtube.com');

  // Step 2: Enter "Playwright automation" in the search box
  await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');

  // Step 3: Click the Search button
  await page.getByRole('button', { name: /^search$/i }).click();

  // Step 4: Verify that search results are displayed
  await expect(page.locator('ytd-search')).toBeVisible();

  // Step 5: Verify that the search results list contains "Playwright"
  await expect(page.locator('ytd-search')).toContainText(/Playwright/i);

  // Step 6: Verify that the page title contains "Playwright automation"
  await expect(page).toHaveTitle(/Playwright automation/i);
});
