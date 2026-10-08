/**
 * Unit tests for the TNEB application definition.
 *
 * The EB document was the first one brought in from outside, and it exposed two
 * distinct failures that looked like one. Both are pinned here.
 *
 *   1. Every step resolved, the test ran, and the run still reported
 *      `application: YouTube`. Nothing matched tnebnet.org, so the test case
 *      fell through to DEFAULT_APPLICATION. The analyzer's role fallback is
 *      good enough to make that invisible until something depends on the
 *      application - the base URL, or the list of elements an
 *      error message offers.
 *
 *   2. The run opened the portal with `?locale=ta` and then looked for a field
 *      called "Consumer No". A Tamil page has no such accessible name. That is
 *      a contradiction inside the manual test case, not a framework bug, and
 *      the only honest fix is in the document.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { applicationById, applicationForTestCase } from '../src/generator/applications/index.js';
import { resolveTarget } from '../src/generator/selectorStrategy.js';
import { generateSpec } from '../src/generator/playwrightGenerator.js';
import { analyzeTestCase, createProvider } from '../src/analyzer/testCaseAnalyzer.js';

const heuristic = createProvider('heuristic');
const tneb = applicationById('tneb');

const rawCase = (overrides) => ({
  id: 'TC-TNEB-XXX',
  title: 'Case',
  preconditions: [],
  steps: [],
  ...overrides,
});

const analyze = (testCase) => analyzeTestCase(testCase, { provider: heuristic, application: tneb });
const catalogId = (step) => resolveTarget(step.target, tneb).catalogId;
const oneStep = (text) => analyze(rawCase({ steps: [{ stepNumber: 1, text }] }));

test('a tnebnet.org URL binds the test case to TNEB, not to the default application', () => {
  const bound = applicationForTestCase(
    rawCase({ steps: [{ stepNumber: 1, text: 'Open https://www.tnebnet.org/awp/login?locale=en' }] }),
  );
  assert.equal(bound?.id, 'tneb');
});

test('"EB website" in the prose binds the test case when no step has a URL', () => {
  const bound = applicationForTestCase(
    rawCase({ title: 'Login into EB Website', steps: [{ stepNumber: 1, text: 'Click the e-Invoice link' }] }),
  );
  assert.equal(bound?.id, 'tneb');
});

test('the e-Invoice form fields each resolve to their own catalog entry', async () => {
  for (const [text, expected] of [
    ['Click the e-Invoice link', 'tneb.eInvoiceTab'],
    ['Verify that the e-Invoice tab is visible', 'tneb.eInvoiceTab'],
    ['Enter "123456789012" in the Consumer No box', 'tneb.consumerNo'],
    ['Enter "9000000000" in the Registered Mobile No box', 'tneb.mobileNo'],
    ['Enter "092026" in the Bill Month/Year box', 'tneb.billMonth'],
    ['Click the Download in English button', 'tneb.downloadEnglishButton'],
    ['Click the Download in Tamil button', 'tneb.downloadTamilButton'],
    ['Verify that the invoice summary is visible', 'tneb.invoiceSummary'],
    ['Verify that the error message is visible', 'tneb.errorMessage'],
  ]) {
    const canonical = await oneStep(text);
    assert.equal(catalogId(canonical.steps[0]), expected, `"${text}"`);
  }
});

test('the two Download buttons do not collide', async () => {
  // Both match /download/, so the language has to be what separates them -
  // otherwise a test case for the Tamil bill would silently check the English
  // one, and pass.
  const english = await oneStep('Click the Download in English button');
  const tamil = await oneStep('Click the Download in Tamil button');
  assert.notEqual(catalogId(english.steps[0]), catalogId(tamil.steps[0]));

  const { code } = generateSpec({ ...tamil, application: 'tneb' });
  assert.match(code, /getByRole\('button', \{ name: \/download\\s\*\(in\\s\*\)\?tamil\/i \}\)\.click\(\)/);
});

test('"Consumer No" is the same field however the tester spells it', async () => {
  for (const text of [
    'Enter "123456789012" in the Consumer No box',
    'Enter "123456789012" in the Consumer No. field',
    'Enter "123456789012" in the Consumer Number text box',
  ]) {
    const canonical = await oneStep(text);
    assert.equal(catalogId(canonical.steps[0]), 'tneb.consumerNo', `"${text}"`);
  }
});

test('"the invoice is downloaded" asserts the bill is actually there', async () => {
  // The original test case stopped at the click, which passes whether a bill
  // comes back or not. The shorthand has to resolve to a real assertion.
  const canonical = await oneStep('Verify that the invoice is downloaded');
  assert.equal(canonical.steps[0].action, 'ASSERT_VISIBLE');
  assert.equal(catalogId(canonical.steps[0]), 'tneb.invoiceSummary');
});

test('an element the catalog has never heard of falls back to its role and name', async () => {
  // This is why the EB run looked healthy while bound to the wrong
  // application: a step that names a role noun needs no catalog entry at all.
  // Useful, and worth knowing about - the fallback cannot know that TNEB spells
  // the field "Consumer No." with a full stop, so a catalog entry is still the
  // place to absorb that.
  const canonical = await oneStep('Click the Pay Bill button');
  const resolved = resolveTarget(canonical.steps[0].target, tneb);
  assert.equal(resolved.source, 'analyzer');
  assert.equal(resolved.strategy, 'role');
  assert.equal(resolved.catalogId, undefined);
});

test('a step naming neither a catalog element nor a role is refused, with TNEB elements offered', async () => {
  const canonical = await oneStep('Click on Pay Bill');
  assert.throws(
    () => resolveTarget(canonical.steps[0].target, tneb),
    (error) => {
      assert.equal(error.code, 'TARGET_NOT_UNDERSTOOD');
      // The hint has to list this application's elements. Before tneb.js
      // existed it listed YouTube's, which is a confusing thing to be told
      // while testing an electricity board.
      assert.match(error.hint, /Consumer No box/);
      assert.doesNotMatch(error.hint, /video player/);
      assert.match(error.hint, /applications\/tneb\.js/);
      return true;
    },
  );
});

test('navigation keeps the live portal path and the locale', async () => {
  const canonical = await oneStep('Open https://www.tnebnet.org/awp/login?locale=en');

  const live = generateSpec({ ...canonical, application: 'tneb' }).code;

  assert.match(live, /page\.goto\('https:\/\/www\.tnebnet\.org\/awp\/login\?locale=en'\)/);
});

test('account details named as placeholders are read from .env, never written into the spec', async () => {
  const canonical = await analyze(
    rawCase({
      steps: [
        { stepNumber: 1, text: 'Open https://www.tnebnet.org/awp/login?locale=en' },
        { stepNumber: 2, text: 'Enter <consumer no> in the Consumer No field' },
        { stepNumber: 3, text: 'Enter “<mobile no>”in the Registered Mobile No field' },
        { stepNumber: 4, text: 'Verify that the invoice summary contains "<consumer no>"' },
      ],
    }),
  );
  assert.equal(catalogId(canonical.steps[1]), 'tneb.consumerNo');
  assert.equal(catalogId(canonical.steps[2]), 'tneb.mobileNo');

  const { code } = generateSpec({ ...canonical, application: 'tneb' });
  assert.match(code, /\.fill\(fromEnv\('TNEB_CONSUMER_NO'\)\)/);
  assert.match(code, /\.fill\(fromEnv\('TNEB_MOBILE_NO'\)\)/);
  assert.match(code, /toContainText\(fromEnv\('TNEB_CONSUMER_NO'\)\)/);
  assert.match(code, /secrets {3}: TNEB_CONSUMER_NO, TNEB_MOBILE_NO/);
});
