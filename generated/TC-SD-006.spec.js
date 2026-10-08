// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-SD-006
//   application: SauceDemo
//   source    : input/sample-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-SD-006 - Checkout', async ({ page }, testInfo) => {
  // Precondition: User is logged in
  // Precondition: Product is in cart
  // Precondition: Shopping cart is open
  // Precondition: Checkout information page is displayed
  // Precondition: Required information is entered
  // Precondition: Checkout overview is displayed
  // Precondition: Order is completed

  await test.step('Setup: reach the starting point of the manual test case', async () => {
    await page.goto('https://www.saucedemo.com');
    await page.getByPlaceholder(/^Username$/i).fill('standard_user');
    await page.getByPlaceholder(/^Password$/i).fill('secret_sauce');
    await page.getByRole('button', { name: /^login$/i }).click();
  });

  await test.step('Step 1: Add Sauce Labs Backpack to cart', async () => {
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Open shopping cart', async () => {
    await page.locator('.shopping_cart_link').click();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Click Checkout', async () => {
    await page.locator('[data-test="checkout"]').click();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Enter first name', async () => {
    await page.getByPlaceholder(/^First Name$/i).fill('John');
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Enter last name', async () => {
    await page.getByPlaceholder(/^Last Name$/i).fill('Doe');
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Enter postal code', async () => {
    await page.getByPlaceholder(/Postal Code/i).fill('12345');
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Click Continue', async () => {
    await page.locator('[data-test="continue"]').click();
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 8: Click Finish', async () => {
    await page.locator('[data-test="finish"]').click();
    await testInfo.attach('Step 8', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 9: Verify confirmation message', async () => {
    await expect(page.locator('.complete-header')).toContainText(/Thank you for your order/i);
    await testInfo.attach('Step 9', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
