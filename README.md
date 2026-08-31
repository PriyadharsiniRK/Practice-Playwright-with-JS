# Practice-Playwright-with-JS

Playwright (JavaScript) test automation practice project.

## Test: Search YouTube via Google and play a video result

Automated from the manual test case `Youtube_Test.docx`:

1. Type `youtube.com` in the Google search bar and press Enter.
2. Search YouTube for `playwright with javascript` and press Enter.
3. Select and open the second listed video.
4. Verify the video is playing.

Spec file: [`tests/youtube-search.spec.js`](tests/youtube-search.spec.js)

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

## Setup

```bash
npm install
npx playwright install chromium   # first time only, downloads the browser
```

## Run the test

```bash
npm test              # headless run
npm run test:headed   # watch it run in a visible browser
```

Each run records a screenshot, a video, and (on retry) a trace for the test,
plus step screenshots attached at each of the four manual steps above.

## View the HTML report (with screenshots & video)

```bash
npm run report
```

This opens `playwright-report/index.html`. Open the test to see:
- the 4 test steps,
- attached screenshots for each step,
- the full-run video recording,
- the trace (on retry), viewable with the built-in trace viewer.

Report and raw artifacts are written to `playwright-report/` and
`test-results/` (both git-ignored).
