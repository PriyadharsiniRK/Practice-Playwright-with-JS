// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-EB-001
//   application: TNEB
//   source    : input/EB-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-EB-001 - Login into EB Website', async ({ page }, testInfo) => {
  // Precondition: User has internet access.

  await test.step('Step 1: Open https://www.tnebnet.org/awp/login?locale=ta website', async () => {
    await page.goto('https://www.tnebnet.org/awp/login?locale=ta');
    await testInfo.attach('Step 1', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 2: Click on e-Invoice link', async () => {
    await page.getByRole('link', { name: /e-?\s*invoice/i }).click();
    await testInfo.attach('Step 2', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 3: Enter “030460031239” in the Consumer No field', async () => {
    await page.getByRole('textbox', { name: /consumer\s*(no|number)/i }).fill('030460031239');
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Enter “9843081645”in the Registered Mobile No field', async () => {
    await page.getByRole('textbox', { name: /mobile\s*(no|number)/i }).fill('9843081645');
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Enter “092026” in the Bill Month/Year field', async () => {
    await page.getByRole('textbox', { name: /month\s*\/?\s*year/i }).fill('092026');
    await testInfo.attach('Step 5', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 6: Click on Download in English button', async () => {
    await page.getByRole('button', { name: /download\s*(in\s*)?english/i }).click();
    await testInfo.attach('Step 6', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 7: Verify that the invoice summary is visible', async () => {
    await expect(page.locator('.invoice-summary')).toBeVisible();
    await testInfo.attach('Step 7', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
