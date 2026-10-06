// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-CI-001
//   application: CarInfo
//   source    : input/carinfo-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-CI-001 - Look up a vehicle by registration number', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

  await test.step('Step 1: Open https://car.info', async () => {
    await page.goto('http://127.0.0.1:4176/');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Enter "KFG40L" in the registration number box', async () => {
    await page.getByLabel(/registration number/i).fill('KFG40L');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Press Enter', async () => {
    await page.keyboard.press('Enter');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify that the vehicle page is displayed', async () => {
    await expect(page).toHaveURL(/\?s=/i);
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that vehicle details are displayed', async () => {
    await expect(page.locator('.vehicle-card')).toBeVisible();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Verify that the vehicle title contains "KFG40L"', async () => {
    await expect(page.locator('h1.vehicle-heading')).toContainText(/KFG40L/i);
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Verify that the vehicle title contains "XC40"', async () => {
    await expect(page.locator('h1.vehicle-heading')).toContainText(/XC40/i);
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
