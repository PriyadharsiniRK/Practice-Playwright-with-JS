/**
 * Unit tests for refusing a step that bundles several actions.
 *
 * The canonical model carries one action per step. A step like "Open YouTube,
 * enter a search term, submit" used to be read as its first clause with the
 * rest silently dropped: the generated test navigated and stopped, while its
 * step title still claimed all three. Partial understanding presented as a
 * whole is the one failure mode this project is built to avoid, so the
 * analyzer now refuses and says how to split it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { actionClauses } from '../src/analyzer/heuristicProvider.js';
import { applicationById } from '../src/generator/applications/index.js';
import { analyzeTestCase, createProvider } from '../src/analyzer/testCaseAnalyzer.js';

const heuristic = createProvider('heuristic');
const youtube = applicationById('youtube');

const oneStep = (text) =>
  analyzeTestCase(
    { id: 'TC-X-001', title: 'Case', preconditions: [], steps: [{ stepNumber: 1, text }] },
    { provider: heuristic, application: youtube },
  );

test('a step bundling three actions is refused, and the split is spelled out', async () => {
  await assert.rejects(() => oneStep('Open YouTube, enter a search term, submit'), (error) => {
    assert.equal(error.code, 'MULTIPLE_ACTIONS_IN_STEP');
    assert.match(error.message, /describes 3 actions/);
    assert.match(error.hint, /1\. Open YouTube/);
    assert.match(error.hint, /2\. enter a search term/);
    assert.match(error.hint, /3\. submit/);
    return true;
  });
});

test('"Enter a query and press Enter" is two actions', async () => {
  await assert.rejects(() => oneStep('Enter a query and press Enter'), /MULTIPLE_ACTIONS_IN_STEP|describes 2 actions/);
});

test('an "and" inside a quoted value does not split the step', async () => {
  // The value is the thing being typed, not a second instruction.
  assert.deepEqual(actionClauses('Enter "Playwright and Selenium" in the search box'), [
    'Enter "" in the search box',
  ]);

  const canonical = await oneStep('Enter "Playwright and Selenium" in the search box');
  assert.equal(canonical.steps[0].action, 'FILL');
  assert.equal(canonical.steps[0].value, 'Playwright and Selenium');
});

test('a comma inside a quoted value does not split the step either', async () => {
  const canonical = await oneStep('Enter "testing, automation" in the search box');
  assert.equal(canonical.steps[0].action, 'FILL');
  assert.equal(canonical.steps[0].value, 'testing, automation');
});

test('ordinary single-action steps are untouched', async () => {
  for (const [text, action] of [
    ['Open https://www.youtube.com', 'NAVIGATE'],
    ['Click the Search button', 'CLICK'],
    ['Press Enter', 'PRESS'],
    ['Navigate back', 'GO_BACK'],
    ['Verify that search results are displayed', 'ASSERT_VISIBLE'],
    ['Verify that the search results list contains "Playwright"', 'ASSERT_TEXT'],
  ]) {
    const canonical = await oneStep(text);
    assert.equal(canonical.steps[0].action, action, `"${text}" should be ${action}`);
  }
});

test('a description that merely mentions a noun is not a second action', async () => {
  // "results and videos" has no verb in the second clause, so it is one action.
  assert.equal(actionClauses('Verify that results and videos are displayed').length, 1);
});
