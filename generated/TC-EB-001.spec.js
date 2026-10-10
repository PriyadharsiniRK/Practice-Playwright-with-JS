// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-EB-001
//   application: TNEB
//   source    : input/EB-tests.docx
//   analyzer  : heuristic
//   screenshots: one per step
//   secrets   : TNEB_CONSUMER_NO, TNEB_MOBILE_NO (from .env - never stored here)
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

/**
 * Reads a credential the manual test case referred to by name.
 *
 * The value is never written into this file: a generated spec is committed
 * like any other source. It lives in .env, which is not. Missing means a
 * loud failure rather than a blank field and a confusing assertion later.
 */
const fromEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env (see .env.example) - the manual test ` +
      `case refers to this value by name rather than stating it.`,
    );
  }
  return value;
};

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

  await test.step('Step 3: Enter “<consumer no>” in the Consumer No field', async () => {
    await page.locator('xpath=//*[text()[contains(normalize-space(), "Consumer No")]]/following::input[1]').fill(fromEnv('TNEB_CONSUMER_NO'));
    await testInfo.attach('Step 3', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 4: Enter “<mobile no>” in the Registered Mobile No field', async () => {
    await page.locator('xpath=//*[text()[contains(normalize-space(), "Registered Mobile No")]]/following::input[1]').fill(fromEnv('TNEB_MOBILE_NO'));
    await testInfo.attach('Step 4', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('Step 5: Enter “092026” in the Bill Month/Year field', async () => {
    await page.locator('xpath=//*[text()[contains(normalize-space(), "Bill Month/Year")]]/following::input[1]').fill('092026');
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
