/**
 * Step-by-step HTML reporter.
 *
 * Playwright's own report is organised for debugging: you open a test, then a
 * step, then an attachment. A manual tester cross-checking the automation wants
 * the opposite shape - the manual wording and the picture side by side, in
 * order, with nothing to click.
 *
 * So this reporter emits one card per manual step: the number, the wording from
 * the Excel/Word document, PASS/FAIL, what the framework actually did, and the
 * screenshot. Images are embedded as data URIs, which makes the output a single
 * file that opens straight from disk - no server, unlike `npm run report`.
 *
 * It complements rather than replaces the built-in report; both are configured
 * in playwright.config.js.
 */

import fs from 'node:fs';
import path from 'node:path';

/** The `Step N: <manual wording>` titles our generator emits. */
const STEP_TITLE = /^Step (\d+):\s*(.*)$/s;

/** Playwright colours its error messages; the codes are noise in HTML. */
const stripAnsi = (value) => String(value).replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '');

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Reads an attachment as a data URI. Playwright hands attachments over either
 * inline (`body`) or spilled to disk (`path`), depending on size and version.
 */
function dataUri(attachment) {
  const type = attachment.contentType || 'image/png';
  if (attachment.body) return `data:${type};base64,${attachment.body.toString('base64')}`;
  if (attachment.path) {
    try {
      return `data:${type};base64,${fs.readFileSync(attachment.path).toString('base64')}`;
    } catch {
      return null; // Artifact was cleaned up between the run and the report.
    }
  }
  return null;
}

/**
 * The Playwright API calls nested inside one manual step, e.g.
 * `Fill "Admin" on getByPlaceholder(/username/i)`. This is what the framework
 * decided to do, which is exactly what a reviewer wants next to the wording.
 */
function describeActions(step) {
  return (step.steps ?? [])
    .filter((child) => child.category === 'pw:api' || child.category === 'expect')
    .map((child) => child.title.replace(/\s+/g, ' ').trim())
    // `Screenshot` is this reporter's own attachment call, not something the
    // manual step asked for.
    .filter((title) => title && title !== 'Screenshot');
}

function renderStep(step, attachmentsByName, failureShot) {
  const match = step.title.match(STEP_TITLE);
  const number = match ? match[1] : '';
  const wording = match ? match[2] : step.title;
  const failed = Boolean(step.error);
  const actions = describeActions(step);
  // A step that fails never reaches its own screenshot call, so fall back to
  // the one Playwright takes on failure - the page as the step left it.
  const stepImage = attachmentsByName.get(`Step ${number}`);
  const image = stepImage ?? (failed ? failureShot : null);
  const caption = !stepImage && image ? 'Captured by Playwright when the step failed.' : null;

  return `
      <div class="step">
        <div class="step-header">
          <div class="step-title"><span class="step-num">${escapeHtml(number)}.</span>${escapeHtml(wording)}</div>
          <div class="status ${failed ? 'fail' : 'pass'}">${failed ? 'FAIL' : 'PASS'}</div>
        </div>
        <div class="step-body">
          ${actions.length ? `<p>${actions.map((a) => escapeHtml(a)).join('<br>')}</p>` : ''}
          ${
            failed
              ? `<div class="note"><strong>Failure</strong>${escapeHtml(
                  stripAnsi(step.error.message ?? '')
                    .split('\n')
                    .slice(0, 6)
                    .join('\n'),
                )}</div>`
              : ''
          }
          ${image ? `<img src="${image}" alt="Step ${escapeHtml(number)} screenshot">` : `<p class="muted">${failed ? 'The step failed before a screenshot could be taken.' : 'No screenshot (generated with --no-screenshots).'}</p>`}
          ${caption ? `<p class="muted caption">${caption}</p>` : ''}
        </div>
      </div>`;
}

function renderTest(entry) {
  const { test, result } = entry;
  const manualSteps = (result.steps ?? []).filter((step) => STEP_TITLE.test(step.title));

  const attachmentsByName = new Map();
  for (const attachment of result.attachments ?? []) {
    if (!attachment.contentType?.startsWith('image/')) continue;
    const uri = dataUri(attachment);
    if (uri && !attachmentsByName.has(attachment.name)) attachmentsByName.set(attachment.name, uri);
  }

  // Playwright's own on-failure screenshot, used for whichever step died.
  const failureShot = attachmentsByName.get('screenshot') ?? null;

  const passed = manualSteps.filter((step) => !step.error).length;
  const failed = manualSteps.length - passed;

  // A test can fail before any manual step runs - a browser that will not
  // launch, for instance. Say so rather than rendering an empty card list.
  const setupError =
    manualSteps.length === 0 && result.error
      ? `<div class="note"><strong>The test failed before any step ran</strong>${escapeHtml(
          stripAnsi(result.error.message ?? '')
            .split('\n')
            .slice(0, 8)
            .join('\n'),
        )}</div>`
      : '';

  return `
    <section class="case">
      <h2>${escapeHtml(test.title)}</h2>
      <div class="subtitle">${escapeHtml(path.basename(test.location.file))} · ${escapeHtml(
        result.status,
      )} · ${Math.round(result.duration)} ms</div>
      <div class="summary">
        <span class="badge pass">${passed} / ${manualSteps.length} steps passed</span>
        ${failed ? `<span class="badge fail">${failed} step${failed === 1 ? '' : 's'} failed</span>` : ''}
      </div>
      ${setupError}
      ${manualSteps.map((step) => renderStep(step, attachmentsByName, failureShot)).join('')}
    </section>`;
}

const STYLE = `
  :root {
    --pass: #1a7f37; --fail: #cf222e; --bg: #f6f8fa;
    --border: #d0d7de; --text: #1f2328; --muted: #57606a;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: var(--bg); color: var(--text); margin: 0; padding: 32px 16px 64px;
  }
  .wrap { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 0 0 4px; }
  .subtitle { color: var(--muted); font-size: 14px; margin-bottom: 16px; }
  .case { margin-bottom: 44px; }
  .summary { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .badge { padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  .badge.pass { background: #dafbe1; color: var(--pass); }
  .badge.fail { background: #ffebe9; color: var(--fail); }
  .badge.neutral { background: #eaeef2; color: var(--muted); }
  .step {
    background: #fff; border: 1px solid var(--border); border-radius: 8px;
    margin-bottom: 20px; overflow: hidden;
  }
  .step-header {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px 18px; border-bottom: 1px solid var(--border);
  }
  .step-title { font-size: 15px; font-weight: 600; }
  .step-num { color: var(--muted); font-weight: 500; margin-right: 8px; }
  .status { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
  .status.pass { background: #dafbe1; color: var(--pass); }
  .status.fail { background: #ffebe9; color: var(--fail); }
  .step-body { padding: 16px 18px; }
  .step-body p { margin: 0 0 12px; font-size: 14px; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .step-body p.muted { font-family: inherit; font-style: italic; }
  .step-body p.caption { margin: 8px 0 0; font-size: 12px; }
  .step-body img { width: 100%; border-radius: 6px; border: 1px solid var(--border); display: block; }
  .note {
    background: #fff8c5; border: 1px solid #d4a72c; border-radius: 6px;
    padding: 12px 14px; font-size: 13px; margin-bottom: 12px; color: #4d3800;
    white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .note strong { display: block; margin-bottom: 4px; font-family: inherit; }
  footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 32px; }
`;

export default class StepReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile ?? path.join('reports', 'step-report.html');
    this.entries = [];
  }

  onTestEnd(test, result) {
    this.entries.push({ test, result });
  }

  async onEnd() {
    // Workers finish in whatever order they finish; the reader expects the
    // test cases in the order they appear in the document.
    this.entries.sort((a, b) => {
      const byFile = a.test.location.file.localeCompare(b.test.location.file);
      return byFile !== 0 ? byFile : a.test.location.line - b.test.location.line;
    });

    const totals = this.entries.reduce(
      (acc, entry) => {
        acc[entry.result.status === 'passed' ? 'passed' : 'failed'] += 1;
        return acc;
      },
      { passed: 0, failed: 0 },
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Manual test case run</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
  <h1>Manual test case run</h1>
  <div class="subtitle">Generated from manual test cases · ${escapeHtml(new Date().toISOString().slice(0, 10))}</div>
  <div class="summary">
    <span class="badge pass">${totals.passed} test${totals.passed === 1 ? '' : 's'} passed</span>
    ${totals.failed ? `<span class="badge fail">${totals.failed} failed</span>` : ''}
    <span class="badge neutral">Each step shows the manual wording, what the framework did, and the page at that moment</span>
  </div>
${this.entries.map(renderTest).join('')}
  <footer>playwright-test-generator · screenshots embedded, so this file opens without a server</footer>
</div>
</body>
</html>
`;

    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(this.outputFile, html, 'utf8');
    console.log(`\n  Step-by-step report: ${this.outputFile}`);
  }
}
