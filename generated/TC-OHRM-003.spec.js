// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-OHRM-003
//   application: OrangeHRM
//   source    : input/orangehrm-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-OHRM-003 - Navigate to the PIM module', async ({ page }) => {
  // Precondition: The demo instance is reachable. Admin credentials are known.

  // Step 1: Open https://opensource-demo.orangehrmlive.com
  await page.goto('https://opensource-demo.orangehrmlive.com');

  // Step 2: Enter "Admin" in the Username field
  await page.getByPlaceholder(/username/i).fill('Admin');

  // Step 3: Enter "admin123" in the Password field
  await page.getByPlaceholder(/password/i).fill('admin123');

  // Step 4: Click the Login button
  await page.getByRole('button', { name: /^\s*login\s*$/i }).click();

  // Step 5: Verify that the dashboard is displayed
  await expect(page).toHaveURL(/\/dashboard/i);

  // Step 6: Click the PIM menu item
  await page.getByRole('link', { name: /^\s*pim\s*$/i }).click();

  // Step 7: Verify that the URL contains "/pim"
  await expect(page).toHaveURL(/\/pim/i);

  // Step 8: Verify that the user profile dropdown is visible
  await expect(page.locator('.oxd-userdropdown-name')).toBeVisible();
});
