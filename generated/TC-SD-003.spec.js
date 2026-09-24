// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-SD-003
//   application: SauceDemo
//   source    : input/sample-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-SD-003 - Add Product to Cart', async ({ page }, testInfo) => {
  // Precondition: User is logged in
  // Precondition: Product details are displayed
  // Precondition: Product has been added
  // Precondition: Shopping cart is open

  await test.step('Setup: reach the starting point of the manual test case', async () => {
    await page.goto('https://www.saucedemo.com');
    await page.getByPlaceholder(/^Username$/i).fill('standard_user');
    await page.getByPlaceholder(/^Password$/i).fill('secret_sauce');
    await page.getByRole('button', { name: /^login$/i }).click();
  });

  await test.step('Step 1: Select Sauce Labs Backpack', async () => {
    await page.getByText(/^Sauce Labs Backpack$/).click();
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Click Add to cart', async () => {
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Open shopping cart', async () => {
    await page.locator('.shopping_cart_link').click();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Verify Sauce Labs Backpack', async () => {
    await expect(page.getByText(/^Sauce Labs Backpack$/)).toBeVisible();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
