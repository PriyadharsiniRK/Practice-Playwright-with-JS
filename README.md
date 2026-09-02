# Practice-Playwright-with-JS

Playwright (JavaScript) test automation practice project.

## Test: Search YouTube via Google and play a video result

Automated from the manual test case `Youtube_Test.docx`:

1. Type `youtube.com` in the Google search bar and press Enter.
2. Search YouTube for `playwright with javascript` and press Enter.
3. Select and open the second listed video.
4. Verify the video is playing.

Spec file: [`tests/youtube-search.spec.js`](tests/youtube-search.spec.js)

## Test: OrangeHRM login and Admin > System Users search (TC01, Page Object Model)

Automated from the manual test case `OrangeHRM_LoginSearch_TC01.docx`, using data
from `OrangeHRM_TestDataJSON.docx`:

1. Hit the URL `https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`.
2. Log in using the username/password from `testdata/OrangeHRM_TestData.json`.
3. Land on the Dashboard page.
4. Navigate to Admin, search System Users by username, and verify the result.

This one uses the Page Object Model: page objects live in [`pages/`](pages)
(`LoginPage.js`, `DashboardPage.js`, `AdminUserPage.js`), test data lives in
[`testdata/OrangeHRM_TestData.json`](testdata/OrangeHRM_TestData.json), and the
spec file is [`tests/orangehrm-admin-search.spec.js`](tests/orangehrm-admin-search.spec.js).

> Note: this runs against OrangeHRM's shared public demo instance, so the
> Employee Name linked to the Admin account and the total user count can
> change between runs (other people use the same demo). The test only
> asserts on the stable fields — Username and Status.

## Test: OrangeHRM add a new system user (TC02, Page Object Model)

Automated from the manual test case `OrangeHRM_LoginAddUser_TC02.docx`, using data
from `OrangeHRM_TestDataJSON.docx`:

1. Hit the URL `https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`.
2. Log in using the username/password from `testdata/OrangeHRM_TestData.json`.
3. Land on the Dashboard page.
4. Navigate to Admin, then click the `+ Add` button.
5. Fill in the Add User form (User Role, Employee Name, Status, Username,
   Password, Confirm Password) and click Save.

This reuses `LoginPage.js`, `DashboardPage.js`, and `AdminUserPage.js` (which
also has a `clickAdd()` method for the `+ Add` button), and adds a new
page object, [`pages/AddUserPage.js`](pages/AddUserPage.js). Test data lives
in the same [`testdata/OrangeHRM_TestData.json`](testdata/OrangeHRM_TestData.json)
file, under the `addUser` section. Spec file:
[`tests/orangehrm-add-user.spec.js`](tests/orangehrm-add-user.spec.js).

> Notes on the shared public demo instance:
> - **Username**: the test appends the current time to the username from the
>   test data, so it's always a brand-new username. Otherwise, re-running the
>   test would fail with "already exists" the second time, since usernames
>   created on this shared demo are never deleted automatically.
> - **Employee Name**: the Employee Name in the test data (`AdminUser080902
>   Tester`) is a made-up example name. On a shared public demo, a specific
>   made-up employee usually won't exist as a real employee record.
>   `AddUserPage.selectEmployeeName()` tries that exact name first, and if
>   OrangeHRM says "No Records Found", it automatically falls back to
>   picking whichever real employee comes up first — so the test can still
>   finish the flow. Because of this, the test does not assert on which
>   Employee Name ended up on the saved user, only on Username, User Role,
>   and Status.

## Test: OrangeHRM search and edit a system user (TC03, Page Object Model)

Automated from the manual test case `OrangeHRM_LoginEditUser_TC03.docx`, using data
from `OrangeHRM_TestDataJSON.docx`:

1. Log in to OrangeHRM.
2. Land on the Dashboard page.
3. Navigate to the Admin site.
4. Search for a user.
5. Click the edit (pencil) icon to edit that user's details.
6. Update the values on the Edit screen and click Save.

This reuses `LoginPage.js`, `DashboardPage.js`, `AdminUserPage.js` (which now
also has `clickEditFirstRow()`), and `AddUserPage.js`, plus a new page object,
[`pages/EditUserPage.js`](pages/EditUserPage.js), for the Edit User form
(same as Add User, but Username is already filled in and there's a
"Change Password ?" checkbox that reveals Password/Confirm Password). Test
data lives in the same
[`testdata/OrangeHRM_TestData.json`](testdata/OrangeHRM_TestData.json) file,
under the `editUser` section. Spec file:
[`tests/orangehrm-edit-user.spec.js`](tests/orangehrm-edit-user.spec.js).

> **Why this test doesn't edit the built-in "Admin" user:** the manual
> testcase demonstrates editing OrangeHRM's real "Admin" account — renaming
> its username and changing its password. Since this runs against the
> shared public demo, doing that for real would break the standard
> Admin/admin123 login for everyone else using the same demo (including our
> own other tests). So this test creates its own disposable user first (a
> setup step, not part of the manual testcase), then searches for and edits
> **that** user instead — exercising the exact same search → edit → update
> → save flow, just on a safe, throwaway target.
>
> Same shared-demo caveats as the Add User test apply here too: the
> username gets a unique time-based suffix, and the Employee Name update
> picks a real employee rather than typing made-up text (the Employee Name
> box only accepts a name selected from its suggestion list).

## Test: OrangeHRM - Login and Add Job Title (TC04)

Automated from the manual test case `OrangeHRM_LoginAddJob_TC04.docx`:

1. Login to OrangeHRM (`opensource-demo.orangehrmlive.com`, Admin/admin123).
2. Land on the dashboard.
3. Navigate to Admin > Job.
4. Click **+ Add** and fill in the Job Title / Job Description.
5. Save and verify the new job title appears in the list.

Test data (job title & description) is **data-driven from an Excel file**
instead of being hardcoded or read from JSON — the spec loops over every row
in `testdata/AddJobTitle.xlsx` and runs the same steps once per row.

- Spec file: [`tests/orangehrm-add-job.spec.js`](tests/orangehrm-add-job.spec.js)
- Excel reader helper: [`utils/excelReader.js`](utils/excelReader.js) (uses [`exceljs`](https://www.npmjs.com/package/exceljs))
- Test data: [`testdata/AddJobTitle.xlsx`](testdata/AddJobTitle.xlsx)

To add more test cases, just add more rows to the Excel sheet — no code
changes needed. Columns: `TestCaseId`, `JobTitle`, `JobDescription`.

## Test: OrangeHRM update General Information (TC05, Page Object Model)

Automated from the manual test case for updating Admin > Organization >
General Information:

1. Log in to OrangeHRM.
2. Land on the Dashboard page.
3. Navigate to the Admin site.
4. Click **Organization**, then click **General Information**.
5. Click the Edit icon.
6. Update values and click Save.

Reuses `LoginPage.js` and `DashboardPage.js`, plus a new page object,
[`pages/GeneralInformationPage.js`](pages/GeneralInformationPage.js), for the
General Information form (an Edit toggle switch instead of a separate Edit
User page). Test data lives in the same
[`testdata/OrangeHRM_TestData.json`](testdata/OrangeHRM_TestData.json) file,
under the `generalInfo` section. Spec file:
[`tests/orangehrm-update-general-info.spec.js`](tests/orangehrm-update-general-info.spec.js).

> **Why this test restores the values it changes:** unlike Add User or Add
> Job Title, "General Information" isn't a list you can add a throwaway row
> to — it's a single global settings record (Organization Name, Registration
> Number, Tax ID, address, Notes...) shared by everyone using the demo, with
> no disposable stand-in to edit instead. So this test reads the current
> values of the fields it's about to touch **before** changing anything (a
> setup step, not part of the manual testcase), updates just those fields and
> saves — exercising the exact "click Edit, update values, click Save" flow
> the testcase describes — then restores the original values it read and
> saves again (a cleanup step), leaving the shared demo the way it was found.
> Only 3 low-risk fields are touched (Registration Number, Tax ID, Notes),
> not Organization Name, Phone, Email, or Address.

## Setup

```bash
npm install
npx playwright install chromium   # first time only, downloads the browser
```

## Run the tests

```bash
npm test                                        # headless run, all specs
npm run test:headed                              # watch it run in a visible browser
npx playwright test tests/orangehrm-add-user.spec.js   # run just one spec
```

Each run records a screenshot, a video, and (on retry) a trace for every
test, plus step screenshots attached at each manual test step.

## View the HTML report (with screenshots & video)

```bash
npm run report
```

This opens `playwright-report/index.html`. Open any test to see:
- its test steps,
- attached screenshots for each step,
- the full-run video recording,
- the trace (on retry), viewable with the built-in trace viewer.

Report and raw artifacts are written to `playwright-report/` and
`test-results/` (both git-ignored).
