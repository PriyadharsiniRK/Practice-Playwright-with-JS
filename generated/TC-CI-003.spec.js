// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-CI-003
//   application: CarInfo
//   source    : input/carinfo-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-CI-003 - A signed-out visitor is offered sign-in', async ({ page }, testInfo) => {
  // Precondition: User has internet access. User is not signed in.

  await test.step('Step 1: Open https://car.info', async () => {
    await page.goto('http://127.0.0.1:4176/');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Verify that the Log in link is visible', async () => {
    await expect(page.getByRole('link', { name: /^log in$/i })).toBeVisible();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Verify that the vehicle details are not displayed', async () => {
    await expect(page.locator('.vehicle-card')).toBeHidden();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
