// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-SD-005
//   application: SauceDemo
//   source    : input/sample-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-SD-005 - Product Sorting', async ({ page }, testInfo) => {
  // Precondition: User is logged in
  // Precondition: Products page is displayed
  // Precondition: Price sorting is selected

  await test.step('Setup: reach the starting point of the manual test case', async () => {
    await page.goto('https://www.saucedemo.com');
    await page.getByPlaceholder(/^Username$/i).fill('standard_user');
    await page.getByPlaceholder(/^Password$/i).fill('secret_sauce');
    await page.getByRole('button', { name: /^login$/i }).click();
  });

  await test.step('Step 1: Open product sorting dropdown', async () => {
    await page.locator('[data-test="product_sort_container"]').click();
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Select Price low to high', async () => {
    await page.locator('[data-test="product_sort_container"]').selectOption({ label: 'Price (low to high)' });
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Verify first product price', async () => {
    await expect(page.locator('.inventory_item_price').first()).toContainText(/\$7\.99/i);
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
