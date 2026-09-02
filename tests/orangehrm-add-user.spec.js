const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { AdminUserPage } = require('../pages/AdminUserPage');
const { AddUserPage } = require('../pages/AddUserPage');

// Load the test data (username, password, etc.) from the JSON file instead
// of typing it directly into the test.
const testData = require('../testdata/OrangeHRM_TestData.json');
const data = testData[0]; // the JSON file is a list with one entry in it

// TC02: Login, then add a new system user.
//
// Steps (from the manual testcase):
// 1. Open the login page.
// 2. Log in using the username/password from the JSON file.
// 3. Check that we land on the Dashboard page.
// 4. Go to Admin, then click the "+ Add" button.
// 5. Fill in the Add User form and click Save.

test('OrangeHRM: login and add a new system user', async ({ page }, testInfo) => {
  // Employee Name selection polls the live demo's autocomplete across up
  // to 5 candidate queries, which can take longer than the framework's 30s
  // default when the demo is slow to respond.
  test.setTimeout(90000);

  // Create one "page object" for each screen we'll visit.
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const adminUserPage = new AdminUserPage(page);
  const addUserPage = new AddUserPage(page);

  // This site is a public demo that many people use at the same time, so a
  // username that worked yesterday might already be taken today. We add the
  // current time to the end of the username from our test data to make sure
  // it's always a brand new one.
  const newUsername = data.addUser.username + Date.now();

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

  await test.step('Step 4: Go to Admin and click + Add', async () => {
    await dashboardPage.goToAdmin();
    await adminUserPage.waitUntilLoaded();
    await adminUserPage.clickAdd();
    await addUserPage.waitUntilLoaded();

    await testInfo.attach('step4-add-user-form', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Step 5: Fill in the form and click Save', async () => {
    await addUserPage.selectUserRole(data.addUser.userRole);
    await addUserPage.selectStatus(data.addUser.status);
    await addUserPage.selectEmployeeName(data.addUser.employeeName);
    await addUserPage.fillUsername(newUsername);
    await addUserPage.fillPassword(data.addUser.password);

    await testInfo.attach('step5-form-filled', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await addUserPage.save();

    // After saving, OrangeHRM sends us back to the System Users list.
    await expect(page).toHaveURL(/viewSystemUsers/);

    // Search for the user we just created, to prove it was really saved.
    await adminUserPage.waitUntilLoaded();
    await adminUserPage.searchByUsername(newUsername);

    await testInfo.attach('step5-search-new-user', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    const rowCount = await adminUserPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Check the new user shows up with the role and status we picked.
    //
    // Note: we do NOT check the Employee Name here. Since this demo site is
    // shared by many people, the exact employee from our test data may not
    // exist anymore, so AddUserPage.selectEmployeeName() might have picked a
    // different real employee instead. Username, User Role and Status are
    // the values that stay reliable and match what we asked for.
    const firstRow = await adminUserPage.getFirstRowData();
    expect(firstRow.username).toBe(newUsername);
    expect(firstRow.userRole).toBe(data.addUser.userRole);
    expect(firstRow.status).toBe(data.addUser.status);
  });
});
