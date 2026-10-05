// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-CI-004
//   application: CarInfo
//   source    : input/carinfo-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-CI-004 - An unknown registration number returns no vehicle', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

  await test.step('Step 1: Open https://car.info', async () => {
    await page.goto('http://127.0.0.1:4176/');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Enter "ZZZ999" in the registration number box', async () => {
    await page.getByLabel(/registration number/i).fill('ZZZ999');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Click the Search button', async () => {
    await page.getByRole('button', { name: /^search$/i }).click();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify that search results are displayed', async () => {
    await expect(page.locator('.vehicle-results')).toBeVisible();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that the vehicle details are not displayed', async () => {
    await expect(page.locator('.vehicle-card')).toBeHidden();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
