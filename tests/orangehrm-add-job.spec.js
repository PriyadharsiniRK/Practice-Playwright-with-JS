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
        // "Job" isn't a direct link to a page - it's a nav item that opens a
        // submenu (Job Titles, Pay Grades, Employment Status, ...). Open it,
        // then click "Job Titles" to actually navigate.
        const jobTab = page.getByText('Job', { exact: true }).first();
        await jobTab.waitFor({ state: 'visible' });
        await jobTab.click();
        const jobTitlesMenuItem = page.getByRole('menuitem', { name: 'Job Titles' });
        await jobTitlesMenuItem.waitFor({ state: 'visible' });
        await jobTitlesMenuItem.click();
        await page.waitForURL(/viewJobTitleList/);
        await page.getByRole('button', { name: 'Add' }).click();
        await page.waitForURL(/saveJobTitle/);
      });

      await test.step(`Add Job Title and enter values & save (${row.TestCaseId})`, async () => {
        // This site is a public demo that many people (and other runs of
        // this same test) share, so the exact job title from our test data
        // may already exist - OrangeHRM rejects a duplicate Job Title with
        // an inline "Already exists" validation error instead of saving.
        // Append the current time to keep it unique on every run.
        const uniqueJobTitle = `${row.JobTitle} ${Date.now()}`;

        // Neither field has a "name" attribute on the live form - the Job
        // Title input isn't labelled at all in the accessibility tree, so
        // find it the same way the other page objects find unlabelled
        // inputs: the .oxd-input-group that wraps its own label text.
        const jobTitleBox = page
          .locator('.oxd-input-group', { hasText: 'Job Title' })
          .locator('input');
        await jobTitleBox.fill(uniqueJobTitle);
        await page.getByPlaceholder('Type description here').fill(row.JobDescription);

        await testInfo.attach(`${row.TestCaseId}-before-save`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });

        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByText('Successfully Saved')).toBeVisible();
        await page.waitForURL(/viewJobTitleList/);
        await expect(page.getByText(uniqueJobTitle, { exact: true }).first()).toBeVisible();

        await testInfo.attach(`${row.TestCaseId}-after-save`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      });
    }
  });
});
