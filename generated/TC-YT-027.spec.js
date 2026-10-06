// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-027
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-027 - Liking a video while signed out asks for sign-in', async ({ page }, testInfo) => {
  // Precondition: User has internet access. User is not signed in.

  await test.step('Step 1: Open https://www.youtube.com', async () => {
    await page.goto('http://127.0.0.1:4173/');
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

  await test.step('Step 5: Verify that the sign-in prompt is not visible', async () => {
    await expect(page.locator('#signin-prompt')).toBeHidden();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Click the Like button', async () => {
    await page.locator('#like-button').click();
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Verify that the sign-in prompt is visible', async () => {
    await expect(page.locator('#signin-prompt')).toBeVisible();
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
