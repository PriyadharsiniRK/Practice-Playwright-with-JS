// @ts-check
const path = require('path');
const { test, expect } = require('@playwright/test');
const { readExcelData } = require('../utils/excelReader');

const TESTDATA_FILE = path.join(__dirname, '..', 'testdata', 'AddJobTitle.xlsx');
const ORANGEHRM_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';

/**
 * TC04 - Login to OrangeHRM, navigate to Admin > Job, and add a new Job Title.
 * Test data (job title / description) is read from testdata/AddJobTitle.xlsx
 * so the same steps run once per row in the sheet.
 */
test.describe('OrangeHRM - Login and Add Job Title (TC04)', () => {
  let jobRows;
  test.beforeAll(async () => {
    jobRows = await readExcelData(TESTDATA_FILE, 'AddJobTitle');
  });

  test('Add Job Title from Excel data', async ({ page }, testInfo) => {
    await test.step('Login to OrangeHRM', async () => {
      await page.goto(ORANGEHRM_URL);
      await page.locator('input[name="username"]').fill('Admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.getByRole('button', { name: 'Login' }).click();
    });

    await test.step('Landed to dashboard', async () => {
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible();
    });

    await test.step('Navigate to Admin site', async () => {
      await page.getByRole('link', { name: 'Admin' }).click();
      await expect(page).toHaveURL(/admin/);
    });

    for (const row of jobRows) {
      await test.step(`Click on Jobs and click on +Add button (${row.TestCaseId})`, async () => {
        // The Admin sub-nav tabs aren't reliably exposed with role="link" with
        // an exact accessible name across OrangeHRM versions, so match on
        // visible text instead of assuming a specific tag/role.
        const jobTab = page.getByText('Job', { exact: true }).first();
        await jobTab.waitFor({ state: 'visible' });
        await jobTab.click();
        await page.waitForURL(/viewJobTitleList/);
        await page.getByRole('button', { name: 'Add' }).click();
        await page.waitForURL(/saveJobTitle/);
      });

      await test.step(`Add Job Title and enter values & save (${row.TestCaseId})`, async () => {
        await page.locator('input[name="jobTitle"]').fill(row.JobTitle);
        await page.locator('textarea[name="jobDescription"]').fill(row.JobDescription);

        await testInfo.attach(`${row.TestCaseId}-before-save`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });

        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByText('Successfully Saved')).toBeVisible();
        await page.waitForURL(/viewJobTitleList/);
        await expect(page.getByText(row.JobTitle, { exact: true }).first()).toBeVisible();

        await testInfo.attach(`${row.TestCaseId}-after-save`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      });
    }
  });
});
