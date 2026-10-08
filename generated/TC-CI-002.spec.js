// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-CI-002
//   application: CarInfo
//   source    : input/carinfo-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-CI-002 - Verify the CarInfo homepage', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

  await test.step('Step 1: Open https://car.info', async () => {
    await page.goto('https://car.info');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Verify that the car.info logo is visible', async () => {
    await expect(page.getByRole('link', { name: /car\.info home/i })).toBeVisible();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Verify that the registration number box is visible', async () => {
    await expect(page.getByLabel(/registration number/i)).toBeVisible();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify that the page title contains "car.info"', async () => {
    await expect(page).toHaveTitle(/car\.info/i);
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
