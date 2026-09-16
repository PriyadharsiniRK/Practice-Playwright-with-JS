// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-OHRM-002
//   application: OrangeHRM
//   source    : input/orangehrm-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-OHRM-002 - Reject invalid credentials', async ({ page }, testInfo) => {
  // Precondition: The demo instance is reachable.

  await test.step('Step 1: Open https://opensource-demo.orangehrmlive.com', async () => {
    await page.goto('http://127.0.0.1:4174/');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Enter "Admin" in the Username field', async () => {
    await page.getByPlaceholder(/username/i).fill('Admin');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Enter "wrong-password" in the Password field', async () => {
    await page.getByPlaceholder(/password/i).fill('wrong-password');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Click the Login button', async () => {
    await page.getByRole('button', { name: /^\s*login\s*$/i }).click();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that the login error message is visible', async () => {
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Verify that the URL contains "/auth/login"', async () => {
    await expect(page).toHaveURL(/\/auth\/login/i);
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
