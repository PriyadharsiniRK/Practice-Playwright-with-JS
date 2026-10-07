// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-TNEB-002
//   application: TNEB
//   source    : input/tneb-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-TNEB-002 - The e-Invoice form is reachable without signing in', async ({ page }, testInfo) => {
  // Precondition: User has internet access. User is not signed in.

  await test.step('Step 1: Open https://www.tnebnet.org/awp/login?locale=en', async () => {
    await page.goto('https://www.tnebnet.org/awp/login?locale=en');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Verify that the e-Invoice tab is visible', async () => {
    await expect(page.getByRole('link', { name: /e-?\s*invoice/i })).toBeVisible();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Verify that the Consumer No box is not visible', async () => {
    await expect(page.getByRole('textbox', { name: /consumer\s*(no|number)/i })).toBeHidden();
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Click the e-Invoice link', async () => {
    await page.getByRole('link', { name: /e-?\s*invoice/i }).click();
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Verify that the Consumer No box is visible', async () => {
    await expect(page.getByRole('textbox', { name: /consumer\s*(no|number)/i })).toBeVisible();
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Verify that the Download in English button is visible', async () => {
    await expect(page.getByRole('button', { name: /download\s*(in\s*)?english/i })).toBeVisible();
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
