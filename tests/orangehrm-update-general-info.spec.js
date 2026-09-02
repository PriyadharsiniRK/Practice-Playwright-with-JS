const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { GeneralInformationPage } = require('../pages/GeneralInformationPage');

// Load the test data (username, password, etc.) from the JSON file instead
// of typing it directly into the test.
const testData = require('../testdata/OrangeHRM_TestData.json');
const data = testData[0]; // the JSON file is a list with one entry in it

// TC05: Login, navigate to Admin > Organization > General Information,
// update some values, and save.
//
// Steps (from the manual testcase):
// 1. Login to OrangeHRM.
// 2. Land on the Dashboard page.
// 3. Navigate to the Admin site.
// 4. Click on Organization and click on General Information.
// 5. Click on the Edit icon.
// 6. Update values and click the Save button.
//
// IMPORTANT — why this test restores the values it changes:
// Every other test in this project either creates its own new record (Add
// User, Add Job Title) or, when the manual testcase points at a shared
// resource, edits a disposable stand-in instead (see orangehrm-edit-user
// .spec.js). This testcase is different again: "General Information" isn't
// a list you can add a throwaway row to — it's a SINGLE global settings
// record for the whole OrangeHRM demo (Organization Name, Registration
// Number, Tax ID, address, Notes...), shared by everyone using the demo.
// There's no disposable version of it to edit instead.
//
// So this test: (a) reads the current values of the fields it's about to
// touch BEFORE changing anything (Setup step, not in the manual testcase),
// (b) updates just those fields and saves — exercising the exact "click
// Edit, update values, click Save" flow the testcase describes, then
// (c) restores the original values it read in step (a) and saves again
// (Cleanup step, not in the manual testcase), so the shared demo is left
// the way it was found. Only 3 low-risk fields are touched (Registration
// Number, Tax ID, Notes) — not Organization Name, Phone, Email, or Address,
// which felt more likely to be relied on elsewhere.

test('OrangeHRM: update General Information and save', async ({ page }, testInfo) => {
  // Create one "page object" for each screen we'll visit.
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const generalInfoPage = new GeneralInformationPage(page);

  // Unique values for this run, so it's obvious (and easy to search logs
  // for) which run's edit is currently live on the shared demo, right up
  // until the Cleanup step restores the originals.
  const newRegistrationNumber = data.generalInfo.registrationNumberPrefix + Date.now();
  const newTaxId = data.generalInfo.taxIdPrefix + Date.now();

  let originalValues; // filled in by the Setup step, used by Cleanup

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

  await test.step('Step 3: Navigate to Admin', async () => {
    await dashboardPage.goToAdmin();

    await testInfo.attach('step3-admin-page', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Step 4: Click Organization, then click General Information', async () => {
    await generalInfoPage.navigateToGeneralInformation();
    await expect(page).toHaveURL(/viewOrganizationGeneralInformation/);

    await testInfo.attach('step4-general-information-view', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Setup (not in the manual testcase): record the current values', async () => {
    originalValues = await generalInfoPage.readEditableValues();
  });

  await test.step('Step 5: Click the Edit icon', async () => {
    await generalInfoPage.clickEdit();
  });

  await test.step('Step 6: Update values and click Save', async () => {
    await generalInfoPage.fillEditableValues({
      registrationNumber: newRegistrationNumber,
      taxId: newTaxId,
      notes: data.generalInfo.notes,
    });

    await testInfo.attach('step6-general-info-form-filled', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await generalInfoPage.save();
  });

  // NOTE on CI flakiness: this shared public demo has shown a multi-minute
  // read-after-write delay specifically on this General Information record
  // - clicking Save reliably shows the "Successfully Saved/Updated" toast
  // (see GeneralInformationPage.save()), but immediately reading the field
  // back here can still return a value from an earlier CI run rather than
  // this run's own write. Confirmed by comparing two separate CI runs a few
  // minutes apart: the "stale" value each run read back was consistently
  // the value written 1-2 runs earlier, i.e. the writes DO land, just with
  // a lag well beyond a single test's retry window. This is a live-
  // infrastructure characteristic of the shared demo, not a bug in this
  // test or GeneralInformationPage - the same category of limitation as
  // youtube-search.spec.js's Google CAPTCHA issue (see its own comments).
  await test.step('Verify: the new values were saved', async () => {
    await generalInfoPage.waitUntilLoaded();
    const values = await generalInfoPage.readEditableValues();

    expect(values.registrationNumber).toBe(newRegistrationNumber);
    expect(values.taxId).toBe(newTaxId);
    expect(values.notes).toBe(data.generalInfo.notes);

    await testInfo.attach('step7-verify-updated-values', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Cleanup (not in the manual testcase): restore the original values', async () => {
    await generalInfoPage.clickEdit();
    await generalInfoPage.fillEditableValues(originalValues);
    await generalInfoPage.save();

    await generalInfoPage.waitUntilLoaded();
    const restored = await generalInfoPage.readEditableValues();
    expect(restored).toEqual(originalValues);
  });
});
