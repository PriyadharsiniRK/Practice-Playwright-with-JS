// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-TNEB-001
//   application: TNEB
//   source    : input/tneb-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-TNEB-001 - Download an e-Invoice', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

  await test.step('Step 1: Open https://www.tnebnet.org/awp/login?locale=en', async () => {
    await page.goto('https://www.tnebnet.org/awp/login?locale=en');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Click the e-Invoice link', async () => {
    await page.getByRole('link', { name: /e-?\s*invoice/i }).click();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Enter "123456789012" in the Consumer No box', async () => {
    await page.getByRole('textbox', { name: /consumer\s*(no|number)/i }).fill('123456789012');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Enter "9000000000" in the Registered Mobile No box', async () => {
    await page.getByRole('textbox', { name: /mobile\s*(no|number)/i }).fill('9000000000');
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Enter "092026" in the Bill Month/Year box', async () => {
    await page.getByRole('textbox', { name: /month\s*\/?\s*year/i }).fill('092026');
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Click the Download in English button', async () => {
    await page.getByRole('button', { name: /download\s*(in\s*)?english/i }).click();
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Verify that the invoice summary is visible', async () => {
    await expect(page.locator('.invoice-summary')).toBeVisible();
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 8: Verify that the invoice summary contains "123456789012"', async () => {
    await expect(page.locator('.invoice-summary')).toContainText(/123456789012/i);
    await testInfo.attach('Step 8', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 9: Verify that the error message is not visible', async () => {
    await expect(page.locator('.error-message')).toBeHidden();
    await testInfo.attach('Step 9', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
