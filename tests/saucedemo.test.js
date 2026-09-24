/**
 * Unit tests for the behaviour SauceDemo's manual test cases needed.
 *
 * That document is written in a style the first two applications never used:
 * it names no URL, quotes no values, states its setup as preconditions rather
 * than steps, and asserts the absence of an element. Each of those is a rule
 * the framework had to learn, so each gets a test here.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applicationById,
  applicationForDocument,
  applicationForTestCase,
} from '../src/generator/applications/index.js';
import { generateSpec } from '../src/generator/playwrightGenerator.js';
import { analyzeTestCase, createProvider } from '../src/analyzer/testCaseAnalyzer.js';

const heuristic = createProvider('heuristic');
const saucedemo = applicationById('saucedemo');

const rawCase = (overrides) => ({
  id: 'TC-SD-XXX',
  title: 'Case',
  preconditions: [],
  steps: [],
  ...overrides,
});

const analyze = (testCase) =>
  analyzeTestCase(testCase, { provider: heuristic, application: saucedemo });

test('a test case with no URL binds to the application its prose names', () => {
  const bound = applicationForTestCase(
    rawCase({ preconditions: ['User is on SauceDemo login page'], steps: [{ stepNumber: 1, text: 'Click Login' }] }),
  );
  assert.equal(bound?.id, 'saucedemo');
});

test('a test case naming no site inherits the application of its document', () => {
  const named = rawCase({ id: 'A', preconditions: ['User is on SauceDemo login page'] });
  // "Price sorting is selected" could be any site on earth.
  const anonymous = rawCase({ id: 'B', preconditions: ['Price sorting is selected'] });

  assert.equal(applicationForTestCase(anonymous), undefined);
  assert.equal(applicationForDocument([named, anonymous])?.id, 'saucedemo');
});

test('a document naming two applications supplies no fallback', () => {
  const sauce = rawCase({ id: 'A', preconditions: ['User is on SauceDemo login page'] });
  const tube = rawCase({ id: 'B', steps: [{ stepNumber: 1, text: 'Open https://www.youtube.com' }] });
  assert.equal(applicationForDocument([sauce, tube]), undefined);
});

test('an unquoted value is read when the application declares the wording', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Enter username standard_user' }] }),
  );
  assert.equal(canonical.steps[0].action, 'FILL');
  assert.equal(canonical.steps[0].value, 'standard_user');
});

test('a field whose value the document never states uses the declared test data', async () => {
  const canonical = await analyze(rawCase({ steps: [{ stepNumber: 1, text: 'Enter first name' }] }));
  assert.equal(canonical.steps[0].action, 'FILL');
  assert.equal(canonical.steps[0].value, 'John');
});

test('data entry with no quotes and no declared wording is still refused', async () => {
  await assert.rejects(
    () => analyze(rawCase({ steps: [{ stepNumber: 1, text: 'Enter the discount code' }] })),
    /no quoted value/,
  );
});

test('"open" with no address clicks rather than navigating', async () => {
  const canonical = await analyze(rawCase({ steps: [{ stepNumber: 1, text: 'Open shopping cart' }] }));
  assert.equal(canonical.steps[0].action, 'CLICK');
});

test('"open" with an address still navigates', async () => {
  const canonical = await analyze(
    rawCase({ steps: [{ stepNumber: 1, text: 'Open https://www.saucedemo.com' }] }),
  );
  assert.equal(canonical.steps[0].action, 'NAVIGATE');
  assert.equal(canonical.steps[0].value, 'https://www.saucedemo.com');
});

test('the ExpectedResult column completes an assertion the step text leaves open', async () => {
  const canonical = await analyze(
    rawCase({
      steps: [{ stepNumber: 1, text: 'Verify Products heading', expected: 'Products heading is displayed' }],
    }),
  );
  assert.equal(canonical.steps[0].action, 'ASSERT_VISIBLE');
});

test('"is not displayed" asserts absence, not presence', async () => {
  const canonical = await analyze(
    rawCase({
      steps: [{ stepNumber: 1, text: 'Verify backpack is not displayed', expected: 'Backpack is not displayed' }],
    }),
  );
  assert.equal(canonical.steps[0].action, 'ASSERT_HIDDEN');
});

test('a stated precondition becomes setup the generated test performs', async () => {
  const canonical = await analyze(
    rawCase({ preconditions: ['User is logged in'], steps: [{ stepNumber: 1, text: 'Open shopping cart' }] }),
  );
  const { code } = generateSpec({ ...canonical, application: 'saucedemo' });

  assert.match(code, /Setup: reach the starting point/);
  assert.match(code, /await page\.goto\('https:\/\/www\.saucedemo\.com'\)/);
  assert.match(code, /fill\('standard_user'\)/);
  assert.match(code, /fill\('secret_sauce'\)/);
});

test('a test case that navigates for itself gets no setup block', async () => {
  const canonical = await analyze(
    rawCase({
      preconditions: ['User is logged in'],
      steps: [{ stepNumber: 1, text: 'Open https://www.saucedemo.com' }],
    }),
  );
  const { code } = generateSpec({ ...canonical, application: 'saucedemo' });
  assert.doesNotMatch(code, /Setup: reach the starting point/);
});

test('a test case with no assertion is generated, but says so in its header', async () => {
  const canonical = await analyze(rawCase({ steps: [{ stepNumber: 1, text: 'Click Login' }] }));
  const { code } = generateSpec({ ...canonical, application: 'saucedemo' });
  assert.match(code, /WARNING: this test case states no expected result/);
});

test('a test case with an assertion carries no such warning', async () => {
  const canonical = await analyze(
    rawCase({
      steps: [{ stepNumber: 1, text: 'Verify Products heading', expected: 'Products heading is displayed' }],
    }),
  );
  const { code } = generateSpec({ ...canonical, application: 'saucedemo' });
  assert.doesNotMatch(code, /WARNING/);
});

test('selecting a sort option emits selectOption, not a click', async () => {
  const canonical = await analyze(rawCase({ steps: [{ stepNumber: 1, text: 'Select Price low to high' }] }));
  assert.equal(canonical.steps[0].action, 'SELECT');

  const { code } = generateSpec({ ...canonical, application: 'saucedemo' });
  assert.match(code, /selectOption\(\{ label: 'Price \(low to high\)' \}\)/);
});
