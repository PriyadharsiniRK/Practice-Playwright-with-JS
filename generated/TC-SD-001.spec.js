// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-SD-001
//   application: SauceDemo
//   source    : input/sample-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-SD-001 - Valid Login', async ({ page }, testInfo) => {
  // Precondition: User is on SauceDemo login page
  // Precondition: Valid credentials are entered
  // Precondition: User is on Products page

  await test.step('Setup: reach the starting point of the manual test case', async () => {
    await page.goto('https://www.saucedemo.com');
  });

  await test.step('Step 1: Enter username standard_user', async () => {
    await page.getByPlaceholder(/^Username$/i).fill('standard_user');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Enter password secret_sauce', async () => {
    await page.getByPlaceholder(/^Password$/i).fill('secret_sauce');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Click Login', async () => {
    await page.getByRole('button', { name: /^login$/i }).click();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify Products heading', async () => {
    await expect(page.getByRole('heading', { name: /^products$/i })).toBeVisible();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
