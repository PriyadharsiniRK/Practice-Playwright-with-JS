// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-007
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-007 - Return to the homepage using the logo', async ({ page }, testInfo) => {
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

  await test.step('Step 2: Enter "Playwright automation" in the search box', async () => {
    await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Click the Search button', async () => {
    await page.getByRole('button', { name: /^search$/i }).click();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify that search results are displayed', async () => {
    await expect(page.locator('ytd-search')).toBeVisible();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Click the YouTube logo', async () => {
    await page.getByRole('link', { name: /youtube home/i }).click();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Verify that the page title contains "YouTube"', async () => {
    await expect(page).toHaveTitle(/YouTube/i);
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Verify that the search box is visible', async () => {
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
