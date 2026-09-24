// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-OHRM-001
//   application: OrangeHRM
//   source    : input/orangehrm-tests.xlsx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-OHRM-001 - Log in with valid credentials', async ({ page }, testInfo) => {
  // Precondition: The demo instance is reachable. Admin credentials are known.

  await test.step('Step 1: Open https://opensource-demo.orangehrmlive.com', async () => {
    await page.goto('http://127.0.0.1:4174/');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Enter "Admin" in the Username field', async () => {
    await page.getByPlaceholder(/username/i).fill('Admin');
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Enter "admin123" in the Password field', async () => {
    await page.getByPlaceholder(/password/i).fill('admin123');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Click the Login button', async () => {
    await page.getByRole('button', { name: /^\s*login\s*$/i }).click();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that the dashboard is displayed', async () => {
    await expect(page).toHaveURL(/\/dashboard/i);
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Verify that the dashboard heading is visible', async () => {
    await expect(page.getByRole('heading', { name: /^\s*dashboard\s*$/i })).toBeVisible();
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
