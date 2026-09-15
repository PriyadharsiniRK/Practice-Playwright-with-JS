// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-OHRM-002
//   application: OrangeHRM
//   source    : input/orangehrm-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-OHRM-002 - Reject invalid credentials', async ({ page }) => {
  // Precondition: The demo instance is reachable.

  // Step 1: Open https://opensource-demo.orangehrmlive.com
  await page.goto('http://127.0.0.1:4174/');

  // Step 2: Enter "Admin" in the Username field
  await page.getByPlaceholder(/username/i).fill('Admin');

  // Step 3: Enter "wrong-password" in the Password field
  await page.getByPlaceholder(/password/i).fill('wrong-password');

  // Step 4: Click the Login button
  await page.getByRole('button', { name: /^\s*login\s*$/i }).click();

  // Step 5: Verify that the login error message is visible
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();

  // Step 6: Verify that the URL contains "/auth/login"
  await expect(page).toHaveURL(/\/auth\/login/i);
});
