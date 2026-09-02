const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { AdminUserPage } = require('../pages/AdminUserPage');

// Load the test data (username, password, etc.) from the JSON file instead
// of typing it directly into the test.
const testData = require('../testdata/OrangeHRM_TestData.json');
const data = testData[0]; // the JSON file is a list with one entry in it

// TC01: Login, then search for a user on the Admin page.
//
// Steps (from the manual testcase):
// 1. Open the login page.
// 2. Log in using the username/password from the JSON file.
// 3. Check that we land on the Dashboard page.
// 4. Go to Admin, search System Users by username, and check the result.

test('OrangeHRM: login and search system users as Admin', async ({ page }, testInfo) => {
  // Create one "page object" for each screen we'll visit.
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const adminUserPage = new AdminUserPage(page);

  await test.step('Step 1: Open the login page', async () => {
    await loginPage.goto();
    await expect(loginPage.usernameBox).toBeVisible();

    await testInfo.attach('step1-login-page', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Step 2: Log in with username/password from the JSON file', async () => {
    await loginPage.login(data.username, data.password);
  });

  await test.step('Step 3: Check we landed on the Dashboard page', async () => {
    await dashboardPage.waitUntilLoaded();
    await expect(page).toHaveURL(/dashboard\/index/);

    await testInfo.attach('step3-dashboard-page', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Step 4: Go to Admin and search System Users', async () => {
    await dashboardPage.goToAdmin();
    await adminUserPage.waitUntilLoaded();
    await adminUserPage.searchByUsername(data.adminSearch.username);

    await testInfo.attach('step4-search-results', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // There should be at least 1 row in the results table.
    const rowCount = await adminUserPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Check the first row has the username we searched for, and is Enabled.
    //
    // Note: we do NOT check the Employee Name here. This test runs against
    // OrangeHRM's public demo site, which many people use at the same time,
    // so the employee linked to the "Admin" account keeps changing. Username
    // and Status are the two values that stay reliable.
    const firstRow = await adminUserPage.getFirstRowData();
    expect(firstRow.username).toBe(data.adminSearch.username);
    expect(firstRow.status).toBe(data.adminSearch.expectedStatus);
  });
});
