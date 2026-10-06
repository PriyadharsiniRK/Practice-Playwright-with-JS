/**
 * Unit tests for the CarInfo application definition.
 *
 * Adding a fourth application should need no framework changes at all - only a
 * catalog file. These tests assert that claim: every rule below is satisfied by
 * src/generator/applications/carinfo.js plus rules the first three
 * applications already established.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { applicationById, applicationForTestCase } from '../src/generator/applications/index.js';
import { resolveTarget } from '../src/generator/selectorStrategy.js';
import { generateSpec } from '../src/generator/playwrightGenerator.js';
import { analyzeTestCase, createProvider } from '../src/analyzer/testCaseAnalyzer.js';

const heuristic = createProvider('heuristic');
const carinfo = applicationById('carinfo');

const rawCase = (overrides) => ({
  id: 'TC-CI-XXX',
  title: 'Case',
  preconditions: [],
  steps: [],
  ...overrides,
});

const analyze = (testCase) =>
  analyzeTestCase(testCase, { provider: heuristic, application: carinfo });

/**
 * Which catalog entry a step resolved to. The canonical step carries the
 * tester's wording; the catalog id is settled later by the selector strategy,
 * which is also what the CLI prints.
 */
const catalogId = (step) => resolveTarget(step.target, carinfo).catalogId;

test('a car.info URL binds the test case to CarInfo', () => {
  const bound = applicationForTestCase(
    rawCase({ steps: [{ stepNumber: 1, text: 'Open https://car.info' }] }),
  );
  assert.equal(bound?.id, 'carinfo');
});

test('prose naming car.info binds the test case when no step has a URL', () => {
  const bound = applicationForTestCase(
    rawCase({ preconditions: ['User is on the car.info homepage'], steps: [{ stepNumber: 1, text: 'Click Search' }] }),
  );
  assert.equal(bound?.id, 'carinfo');
});

test('the registration box is reached by its label, not a CSS selector', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Enter "KFG40L" in the registration number box' }] }),
  );
  assert.equal(canonical.steps[0].action, 'FILL');
  assert.equal(canonical.steps[0].value, 'KFG40L');

  const { code } = generateSpec({ ...canonical, application: 'carinfo' });
  assert.match(code, /getByLabel\(\/registration number\/i\)\.fill\('KFG40L'\)/);
});

test('"the vehicle page is displayed" becomes a URL assertion', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Verify that the vehicle page is displayed' }] }),
  );
  assert.equal(canonical.steps[0].action, 'ASSERT_URL');
  // car.info searches with ?s= on the root path, not a separate results path.
  assert.equal(canonical.steps[0].value, '?s=');
});

test('"vehicle details are displayed" resolves to the details card', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Verify that vehicle details are displayed' }] }),
  );
  assert.equal(canonical.steps[0].action, 'ASSERT_VISIBLE');
  assert.equal(catalogId(canonical.steps[0]), 'carinfo.vehicleDetails');
});

test('"vehicle details are not displayed" asserts absence', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Verify that the vehicle details are not displayed' }] }),
  );
  assert.equal(canonical.steps[0].action, 'ASSERT_HIDDEN');
  assert.equal(catalogId(canonical.steps[0]), 'carinfo.vehicleDetails');
});

test('"vehicle title" is an element, "page title" is the browser tab', async () => {
  const element = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Verify that the vehicle title contains "KFG40L"' }] }),
  );
  assert.equal(element.steps[0].action, 'ASSERT_TEXT');
  assert.equal(catalogId(element.steps[0]), 'carinfo.vehicleTitle');

  const page = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Verify that the page title contains "car.info"' }] }),
  );
  assert.equal(page.steps[0].action, 'ASSERT_TITLE');
  assert.equal(page.steps[0].value, 'car.info');
});

test('the Log in link is a target, so sign-in can be asserted without being driven', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Verify that the Log in link is visible' }] }),
  );
  assert.equal(canonical.steps[0].action, 'ASSERT_VISIBLE');
  assert.equal(catalogId(canonical.steps[0]), 'carinfo.loginLink');
});

test('offline mode swaps only the origin, onto CarInfo’s own port', async () => {
  const canonical = await analyze(rawCase({ steps: [{ stepNumber: 1, text: 'Open https://car.info' }] }));

  const live = generateSpec({ ...canonical, application: 'carinfo' }).code;
  const offline = generateSpec({ ...canonical, application: 'carinfo' }, { offline: true }).code;

  assert.match(live, /page\.goto\('https:\/\/car\.info'\)/);
  assert.match(offline, /page\.goto\('http:\/\/127\.0\.0\.1:4176\/'\)/);
});

test('a credential named in a step is read from the environment, never written into the spec', async () => {
  const canonical = await analyze(
    rawCase({
      steps: [
        { stepNumber: 1, text: 'Enter "<username>" in the registration number box' },
        { stepNumber: 2, text: 'Enter "<password>" in the registration number box' },
      ],
    }),
  );

  const { code } = generateSpec({ ...canonical, application: 'carinfo' });

  assert.match(code, /fill\(fromEnv\('CARINFO_USERNAME'\)\)/);
  assert.match(code, /fill\(fromEnv\('CARINFO_PASSWORD'\)\)/);
  // The placeholder may appear in the step title - that is the manual wording,
  // and the report should show it. What must never appear is the placeholder
  // being filled as if it were the value.
  assert.doesNotMatch(code, /fill\('<password>'\)/);
  assert.match(code, /Step 2: Enter "<password>"/);
  // The helper is emitted, and fails loudly rather than filling a blank.
  assert.match(code, /const fromEnv = \(name\) =>/);
  assert.match(code, /is not set\. Add it to \.env/);
  assert.match(code, /secrets {3}: CARINFO_USERNAME, CARINFO_PASSWORD/);
});

test('a test case naming no credential gets no helper', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Enter "KFG40L" in the registration number box' }] }),
  );
  const { code } = generateSpec({ ...canonical, application: 'carinfo' });

  assert.match(code, /\.fill\('KFG40L'\)/);
  assert.doesNotMatch(code, /fromEnv/);
});
