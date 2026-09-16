// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-006
//   application: YouTube
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-006 - Open a video and verify its details', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

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

  await test.step('Step 5: Verify that the video page is displayed', async () => {
    await expect(page).toHaveURL(/\/watch/i);
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Verify that the video player is visible', async () => {
    await expect(page.locator('#movie_player')).toBeVisible();
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Verify that the video title contains "Playwright"', async () => {
    await expect(page.locator('h1.ytd-watch-metadata')).toContainText(/Playwright/i);
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
