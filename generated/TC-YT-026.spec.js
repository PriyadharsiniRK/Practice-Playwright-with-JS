// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-026
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-026 - Open the Comments section', async ({ page }, testInfo) => {
  // Store the site's cookie-consent choice up front, so its consent dialog is not shown.
  await page.context().addCookies([
    { name: 'SOCS', value: 'CAI', domain: '.youtube.com', path: '/' },
  ]);
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

  await test.step('Step 3: Press Enter', async () => {
    await page.keyboard.press('Enter');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Click the first search result', async () => {
    await page.locator('ytd-video-renderer').first().click();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that the Comments section is visible', async () => {
    await expect(page.locator('#comments')).toBeVisible();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
