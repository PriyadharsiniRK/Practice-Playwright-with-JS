const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { AdminUserPage } = require('../pages/AdminUserPage');
const { AddUserPage } = require('../pages/AddUserPage');
const { EditUserPage } = require('../pages/EditUserPage');

// Load the test data (username, password, etc.) from the JSON file instead
// of typing it directly into the test.
const testData = require('../testdata/OrangeHRM_TestData.json');
const data = testData[0]; // the JSON file is a list with one entry in it

// TC03: Login, search for a user, edit it, and save.
//
// Steps (from the manual testcase):
// 1. Login to OrangeHRM.
// 2. Land on the Dashboard page.
// 3. Navigate to the Admin site.
// 4. Search for a user.
// 5. Click the edit icon to edit that user's details.
// 6. Update the values on the Edit screen and click Save.
//
// IMPORTANT — why this test doesn't edit the built-in "Admin" user:
// The manual testcase demonstrates editing the site's real "Admin" account
// (renaming its username and changing its password). This automation runs
// against OrangeHRM's shared public demo, which many people use at once —
// renaming or changing the password of the built-in Admin account would
// break the standard Admin/admin123 login for everyone else (including our
// own other tests). So this test creates its own disposable user first
// (Setup step below, not part of the manual testcase), then searches for
// and edits THAT user instead. Every other part of the flow — search,
// click the pencil icon, change User Role/Employee Name/Username/Password,
// click Save — is exercised exactly as described in the testcase.

test('OrangeHRM: search for a user, edit it, and save', async ({ page }, testInfo) => {
  // Create one "page object" for each screen we'll visit.
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const adminUserPage = new AdminUserPage(page);
  const addUserPage = new AddUserPage(page);
  const editUserPage = new EditUserPage(page);

  // A unique username for the disposable user this test creates and edits.
  // This site is a shared demo, so a fixed username could already exist
  // from an earlier run — adding the current time keeps it unique.
  const setupUsername = data.editUser.setupUsername + Date.now();
  const editedUsername = setupUsername + data.editUser.usernameSuffix;

  await test.step('Step 1: Log in to OrangeHRM', async () => {
    await loginPage.goto();
    await loginPage.login(data.username, data.password);
  });

  await test.step('Step 2: Check we landed on the Dashboard page', async () => {
    await dashboardPage.waitUntilLoaded();
    await expect(page).toHaveURL(/dashboard\/index/);

    await testInfo.attach('step2-dashboard-page', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Setup (not in the manual testcase): create a disposable user to edit', async () => {
    await dashboardPage.goToAdmin();
    await adminUserPage.waitUntilLoaded();
    await adminUserPage.clickAdd();
    await addUserPage.waitUntilLoaded();
    await addUserPage.selectUserRole(data.addUser.userRole);
    await addUserPage.selectStatus(data.addUser.status);
    await addUserPage.selectEmployeeName(data.addUser.employeeName);
    await addUserPage.fillUsername(setupUsername);
    await addUserPage.fillPassword(data.addUser.password);
    await addUserPage.save();
    await expect(page).toHaveURL(/viewSystemUsers/);
  });

  await test.step('Step 3 & 4: Navigate to Admin and search for the user', async () => {
    await adminUserPage.waitUntilLoaded();
    await adminUserPage.searchByUsername(setupUsername);

    await testInfo.attach('step4-search-user', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    const rowCount = await adminUserPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  await test.step('Step 5: Click the edit icon', async () => {
    await adminUserPage.clickEditFirstRow();
    await editUserPage.waitUntilLoaded();
  });

  await test.step('Step 6: Update the values and click Save', async () => {
    // Employee Name: pick a different real employee, so we can see the
    // change actually took effect (see the note on selectEmployeeName()
    // about why we can't just re-type made-up text here).
    await editUserPage.selectEmployeeName('Timothy Lewis Amiano');
    await editUserPage.fillUsername(editedUsername);
    await editUserPage.changePassword(data.editUser.newPassword);

    await testInfo.attach('step6-edit-form-filled', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await editUserPage.save();
    await expect(page).toHaveURL(/viewSystemUsers/);
  });

  await test.step('Verify: search for the edited username and check the row', async () => {
    await adminUserPage.waitUntilLoaded();
    await adminUserPage.searchByUsername(editedUsername);

    await testInfo.attach('step7-verify-updated-user', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    const rowCount = await adminUserPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    const firstRow = await adminUserPage.getFirstRowData();
    expect(firstRow.username).toBe(editedUsername);
    expect(firstRow.userRole).toBe(data.addUser.userRole);
    expect(firstRow.status).toBe(data.addUser.status);
  });
});
