// @ts-check
const path = require('path');
const { test, expect } = require('@playwright/test');
const { readExcelData } = require('../utils/excelReader');

const TESTDATA_FILE = path.join(__dirname, '..', 'testdata', 'AddJobTitle.xlsx');
const ORANGEHRM_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';

// "Job" isn't a direct link to a page - it's a nav item that reveals a
// submenu (Job Titles, Pay Grades, Employment Status, ...). Neither a plain
// click nor a plain hover opens it reliably every time: a click can toggle
// an already-open menu closed when the Job section is already active (2nd+
// row of this loop), and headless-browser hover simulation doesn't always
// trigger the same listeners a real mouse would. So this alternates both
// interactions, retrying until the "Job Titles" item actually shows up.
async function openJobTitlesMenu(page) {
  const jobTab = page.getByText('Job', { exact: true }).first();
  const jobTitlesMenuItem = page.getByRole('menuitem', { name: 'Job Titles' });

  for (let attempt = 0; attempt < 6; attempt++) {
    await jobTab.waitFor({ state: 'visible' });
    if (attempt % 2 === 0) {
      await jobTab.hover();
    } else {
      await jobTab.click();
    }

    const opened = await jobTitlesMenuItem
      .waitFor({ state: 'visible', timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    if (opened) return jobTitlesMenuItem;
  }

  throw new Error('Could not open the Job > Job Titles submenu after multiple attempts');
}

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
    // This test logs in once and then loops through every row in the Excel
    // sheet, and openJobTitlesMenu() can take several attempts per row to
    // reliably open the "Job" submenu - comfortably longer than the
    // framework's 30s default for a multi-row, multi-step flow like this.
    test.setTimeout(90000);

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
        const jobTitlesMenuItem = await openJobTitlesMenu(page);
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
