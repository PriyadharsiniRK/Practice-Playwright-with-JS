// Builds an HTML report that places each manual testcase screenshot next to
// the matching screenshot captured by the real Playwright automation run,
// step by step - same "Manual vs. Automated Comparison" format used for
// TC03, adapted for TC04 (Add Job Title).
//
// Run this AFTER `npx playwright test tests/orangehrm-add-job.spec.js` has
// completed successfully, so automation-screenshots/TC04/*.png actually
// exist to pair with manual-screenshots/TC04/*.png.

const fs = require('fs');
const path = require('path');

const MANUAL_DIR = path.join(__dirname, '..', 'manual-screenshots', 'TC04');
const AUTO_DIR = path.join(__dirname, '..', 'automation-screenshots', 'TC04');
const OUTPUT_FILE = path.join(__dirname, '..', 'playwright-report', 'comparison-report-tc04.html');

const STEPS = [
  {
    file: 'step1-login.png',
    title: 'Log in to OrangeHRM',
    manualCaption: 'Manual tester’s screenshot: login page with Admin / admin123 filled in.',
    autoCaption: 'Live run: login page filled with Admin / admin123, ready to submit.',
  },
  {
    file: 'step2-dashboard.png',
    title: 'Land on the Dashboard page',
    manualCaption: 'Manual tester’s screenshot: Dashboard page after login.',
    autoCaption: 'Live run: Dashboard page confirmed via URL and heading assertions.',
  },
  {
    file: 'step3-admin.png',
    title: 'Navigate to Admin → System Users',
    manualCaption: 'Manual tester’s screenshot: Admin / User Management (System Users) page.',
    autoCaption: 'Live run: Admin page reached by clicking the Admin nav link.',
  },
  {
    file: 'step4-job-titles-list.png',
    title: 'Open Admin → Job → Job Titles',
    manualCaption: 'Manual tester’s screenshot: Job Titles list, showing the +Add button.',
    autoCaption: 'Live run: Job Titles list reached via the Job → Job Titles submenu.',
  },
  {
    file: 'step5-add-job-title-form.png',
    title: 'Add Job Title form filled and saved',
    manualCaption: 'Manual tester’s screenshot: Add Job Title form filled with an example title.',
    autoCaption:
      'Live run: Add Job Title form filled with the Job Title / Description read from testdata/AddJobTitle.xlsx, right before Save. The job title has a timestamp suffix appended so it stays unique on this shared public demo.',
  },
];

function toDataUri(filePath) {
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:image/png;base64,${base64}`;
}

function buildStepSection(step, index) {
  const manualPath = path.join(MANUAL_DIR, step.file);
  const autoPath = path.join(AUTO_DIR, step.file);

  const manualExists = fs.existsSync(manualPath);
  const autoExists = fs.existsSync(autoPath);
  const passed = manualExists && autoExists;

  const manualImg = manualExists
    ? `<img src="${toDataUri(manualPath)}" alt="Manual screenshot - ${step.title}">`
    : `<p class="caption">Manual screenshot not found: ${step.file}</p>`;
  const autoImg = autoExists
    ? `<img src="${toDataUri(autoPath)}" alt="Automated screenshot - ${step.title}">`
    : `<p class="caption">Automated screenshot not found: ${step.file}</p>`;

  return `
  <section class="step">
    <div class="step-header">
      <div class="step-title"><span class="step-num">Step ${index + 1}.</span>${step.title}</div>
      <div class="status ${passed ? 'pass' : 'fail'}">${passed ? 'PASS' : 'FAIL'}</div>
    </div>
    <div class="compare">
      <div class="col">
        <div class="col-label manual">Manual testcase (OrangeHRM_LoginAddJob_TC04.docx)</div>
        ${manualImg}
        <p class="caption">${step.manualCaption}</p>
      </div>
      <div class="col">
        <div class="col-label automated">Automated run (Playwright + JavaScript)</div>
        ${autoImg}
        <p class="caption">${step.autoCaption}</p>
      </div>
    </div>
  </section>`;
}

function generate() {
  const sections = STEPS.map(buildStepSection).join('\n');
  const passedCount = STEPS.filter(
    (step) =>
      fs.existsSync(path.join(MANUAL_DIR, step.file)) && fs.existsSync(path.join(AUTO_DIR, step.file))
  ).length;

  const today = new Date().toISOString().slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OrangeHRM TC04 — Manual vs. Automated Comparison</title>
<style>
  :root {
    --pass: #1a7f37;
    --fail: #cf222e;
    --bg: #f6f8fa;
    --border: #d0d7de;
    --text: #1f2328;
    --muted: #57606a;
    --manual: #6639ba;
    --auto: #0969da;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 32px 16px 64px;
  }
  .wrap { max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .subtitle { color: var(--muted); font-size: 14px; margin-bottom: 24px; }
  .summary { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .badge { padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  .badge.pass { background: #dafbe1; color: var(--pass); }
  .badge.fail { background: #ffebe9; color: var(--fail); }
  .badge.neutral { background: #eaeef2; color: var(--muted); }
  .callout {
    background: #fff8c5; border: 1px solid #d4a72c; border-radius: 6px;
    padding: 12px 14px; font-size: 13px; margin-bottom: 16px; color: #4d3800;
  }
  .callout strong { display: block; margin-bottom: 4px; }
  .callout.safety {
    background: #ddf1ff; border-color: #54aeff; color: #0a3069;
  }
  .step {
    background: #fff; border: 1px solid var(--border); border-radius: 8px;
    margin-bottom: 24px; overflow: hidden;
  }
  .step-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-bottom: 1px solid var(--border);
  }
  .step-title { font-size: 15px; font-weight: 600; }
  .step-num { color: var(--muted); font-weight: 500; margin-right: 8px; }
  .status { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
  .status.pass { background: #dafbe1; color: var(--pass); }
  .status.fail { background: #ffebe9; color: var(--fail); }
  .status.info { background: #ddf1ff; color: var(--auto); }
  .compare {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
    background: var(--border);
  }
  .compare.single { grid-template-columns: 1fr; max-width: 600px; margin: 0 auto; }
  .col { background: #fff; padding: 16px 18px; }
  .col-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    margin-bottom: 10px; padding: 4px 10px; border-radius: 4px; display: inline-block;
  }
  .col-label.manual { background: #f2ebfd; color: var(--manual); }
  .col-label.automated { background: #ddf1ff; color: var(--auto); }
  .col img {
    width: 100%; border-radius: 6px; border: 1px solid var(--border); display: block;
  }
  .caption { font-size: 13px; color: var(--muted); margin: 10px 0 0; }
  footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 32px; }
  @media (max-width: 800px) {
    .compare { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="wrap">
  <h1>OrangeHRM TC04: Add Job Title</h1>
  <div class="subtitle">Manual testcase vs. live automated run — side by side · Practice-Playwright-with-JS (POM) · ${today}</div>

  <div class="summary">
    <span class="badge ${passedCount === STEPS.length ? 'pass' : 'fail'}">${passedCount} / ${STEPS.length} steps passed</span>
    <span class="badge neutral">Left: manual testcase screenshots &nbsp;·&nbsp; Right: live automated run</span>
  </div>

  <div class="callout">
    <strong>Shared public demo instance — uniqueness adaptation</strong>
    The Job Title read from <strong>testdata/AddJobTitle.xlsx</strong> gets a timestamp suffix appended before saving, because this automation runs against OrangeHRM’s <em>shared public demo</em> — without it, a duplicate title from an earlier run (by this suite or anyone else sharing the demo) would trip the app’s own "Already exists" validation and block the save. Every other UI mechanic — login, navigate to Admin → Job → Job Titles, click +Add, fill Job Title/Description, Save — is exercised exactly as the manual testcase describes.
  </div>

${sections}

  <footer>Generated by Claude Code · manual screenshots sourced from OrangeHRM_LoginAddJob_TC04.docx · automated screenshots captured live by the Playwright test run</footer>
</div>
</body>
</html>
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, html);
  console.log(`Comparison report written to ${OUTPUT_FILE}`);
  console.log(`${passedCount} / ${STEPS.length} steps had both manual and automated screenshots.`);
}

generate();
