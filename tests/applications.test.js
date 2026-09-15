/**
 * Unit tests for the multi-application behaviour.
 *
 * The point of the application registry is that the same English sentence must
 * resolve differently depending on which site the test case is for.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { applicationForTestCase, applicationForUrl, applicationById } from '../src/generator/applications/index.js';
import { resolveTarget } from '../src/generator/selectorStrategy.js';
import { emitLocator, generateSpec } from '../src/generator/playwrightGenerator.js';
import { analyzeTestCase, createProvider } from '../src/analyzer/testCaseAnalyzer.js';

const heuristic = createProvider('heuristic');
const youtube = applicationById('youtube');
const orangehrm = applicationById('orangehrm');

test('the application is chosen by the hostname of the first navigation', () => {
  assert.equal(applicationForUrl('https://www.youtube.com/results?q=x')?.id, 'youtube');
  assert.equal(applicationForUrl('https://opensource-demo.orangehrmlive.com/')?.id, 'orangehrm');
  assert.equal(applicationForUrl('https://example.com/'), undefined);

  const testCase = {
    id: 'TC-X',
    title: 'x',
    steps: [{ stepNumber: 1, text: 'Open https://opensource-demo.orangehrmlive.com' }],
  };
  assert.equal(applicationForTestCase(testCase)?.id, 'orangehrm');
});

test('the same wording resolves to a different element per application', () => {
  const target = { description: 'search box' };
  // YouTube's search box is a combobox in the masthead...
  assert.equal(resolveTarget(target, youtube).catalogId, 'youtube.searchBox');
  // ...OrangeHRM's is the sidebar filter, found by placeholder.
  assert.equal(resolveTarget(target, orangehrm).catalogId, 'orangehrm.sidebarSearch');
});

test('OrangeHRM exercises the placeholder and text selector tiers', () => {
  const username = resolveTarget({ description: 'username box' }, orangehrm);
  assert.equal(username.strategy, 'placeholder');
  assert.equal(emitLocator(username.spec), 'page.getByPlaceholder(/username/i)');

  const error = resolveTarget({ description: 'login error message' }, orangehrm);
  assert.equal(error.strategy, 'text');
  assert.equal(emitLocator(error.spec), 'page.getByText(/invalid credentials/i)');
});

test('an unknown element names the right application in the error', () => {
  assert.throws(
    () => resolveTarget({ description: 'payroll widget' }, orangehrm),
    (error) => /Known elements for OrangeHRM/.test(error.hint) && /applications\/orangehrm\.js/.test(error.hint),
  );
});

test('assertion shorthands come from the application, not the framework', async () => {
  const canonical = await analyzeTestCase(
    {
      id: 'TC-OHRM-UNIT',
      title: 'Login',
      steps: [
        { stepNumber: 1, text: 'Open https://opensource-demo.orangehrmlive.com' },
        { stepNumber: 2, text: 'Verify that the dashboard is displayed' },
      ],
    },
    { provider: heuristic },
  );
  assert.equal(canonical.application, 'orangehrm');
  assert.equal(canonical.steps[1].action, 'ASSERT_URL');
  assert.equal(canonical.steps[1].value, '/dashboard');
});

test('offline mode rewrites each application onto its own stand-in port', async () => {
  const canonical = await analyzeTestCase(
    {
      id: 'TC-OHRM-UNIT-2',
      title: 'Login',
      steps: [{ stepNumber: 1, text: 'Open https://opensource-demo.orangehrmlive.com' }],
    },
    { provider: heuristic },
  );
  assert.match(generateSpec(canonical, { offline: true }).code, /page\.goto\('http:\/\/127\.0\.0\.1:4174\//);
  // The real origin is untouched without --offline.
  assert.match(generateSpec(canonical).code, /page\.goto\('https:\/\/opensource-demo\.orangehrmlive\.com'\)/);
});
