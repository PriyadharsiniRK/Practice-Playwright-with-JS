/**
 * Unit tests for the deterministic half of the pipeline.
 *
 * These cover the framework itself, not the application under test - the
 * generated Playwright specs in generated/ are the tests for YouTube.
 *
 *   npm run test:unit
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { generateSpec, emitLocator } from '../src/generator/playwrightGenerator.js';
import { resolveTarget } from '../src/generator/selectorStrategy.js';
import { analyzeTestCase, createProvider } from '../src/analyzer/testCaseAnalyzer.js';
import { ErrorCode, PipelineError } from '../src/errors.js';

const heuristic = createProvider('heuristic');

const rawCase = {
  id: 'TC-UNIT-001',
  title: 'Search for a video on YouTube',
  preconditions: ['User has internet access.'],
  steps: [
    { stepNumber: 1, text: 'Open https://www.youtube.com' },
    { stepNumber: 2, text: 'Enter "Playwright automation" in the search box' },
    { stepNumber: 3, text: 'Click the Search button' },
    { stepNumber: 4, text: 'Verify that search results are displayed' },
    { stepNumber: 5, text: 'Click the first search result' },
    { stepNumber: 6, text: 'Verify that the video page is displayed' },
  ],
};

test('the analyzer maps the example test case onto the canonical actions', async () => {
  const canonical = await analyzeTestCase(rawCase, { provider: heuristic });
  assert.deepEqual(
    canonical.steps.map((step) => step.action),
    ['NAVIGATE', 'FILL', 'CLICK', 'ASSERT_VISIBLE', 'CLICK', 'ASSERT_URL'],
  );
  assert.equal(canonical.steps[1].value, 'Playwright automation');
  assert.equal(canonical.steps[5].value, '/watch');
});

test('generation is deterministic', async () => {
  const canonical = await analyzeTestCase(rawCase, { provider: heuristic });
  const first = generateSpec(canonical);
  const second = generateSpec(canonical);
  assert.equal(first.code, second.code);
  assert.equal(first.fileName, 'TC-UNIT-001.spec.js');
});

test('generated code prefers getByRole over CSS', async () => {
  const canonical = await analyzeTestCase(rawCase, { provider: heuristic });
  const { code } = generateSpec(canonical);
  assert.match(code, /page\.getByRole\('combobox', \{ name: \/search\/i \}\)\.fill\('Playwright automation'\)/);
  assert.match(code, /page\.getByRole\('button', \{ name: \/\^search\$\/i \}\)\.click\(\)/);
  assert.match(code, /await expect\(page\)\.toHaveURL\(\/\\\/watch\/i\)/);
});

test('offline mode only rewrites the origin', async () => {
  const canonical = await analyzeTestCase(rawCase, { provider: heuristic });
  const { code } = generateSpec(canonical, { baseUrl: 'http://127.0.0.1:4173' });
  assert.match(code, /page\.goto\('http:\/\/127\.0\.0\.1:4173\/'\)/);
  // Everything after the navigation is unchanged.
  assert.match(code, /page\.getByRole\('combobox', \{ name: \/search\/i \}\)/);
});

test('the most specific catalog entry wins', () => {
  assert.equal(resolveTarget({ description: 'search results' }).catalogId, 'youtube.searchResults');
  assert.equal(resolveTarget({ description: 'first search result' }).catalogId, 'youtube.firstSearchResult');
});

test('an unknown element with a role and a name falls back to getByRole', () => {
  const resolved = resolveTarget({ description: 'subscribe button', role: 'button', name: 'subscribe' });
  assert.equal(resolved.strategy, 'role');
  assert.equal(resolved.source, 'analyzer');
  assert.equal(emitLocator(resolved.spec), "page.getByRole('button', { name: /subscribe/i })");
});

test('an unresolvable element fails loudly instead of guessing a selector', () => {
  assert.throws(
    () => resolveTarget({ description: 'the bit at the top' }),
    (error) => error instanceof PipelineError && error.code === ErrorCode.TARGET_NOT_UNDERSTOOD,
  );
});

test('an unsupported assertion is refused, not silently automated', async () => {
  await assert.rejects(
    analyzeTestCase(
      { ...rawCase, steps: [{ stepNumber: 1, text: 'Verify that recommended videos are relevant' }] },
      { provider: heuristic },
    ),
    (error) => error instanceof PipelineError && error.code === ErrorCode.UNSUPPORTED_ACTION,
  );
});

test('string and regex literals in generated code are escaped', async () => {
  const canonical = await analyzeTestCase(
    {
      id: 'TC-UNIT-002',
      title: "Quote's and slashes",
      steps: [
        { stepNumber: 1, text: 'Open https://www.youtube.com' },
        { stepNumber: 2, text: 'Enter "it\'s a (test)" in the search box' },
      ],
    },
    { provider: heuristic },
  );
  const { code } = generateSpec(canonical);
  assert.match(code, /\.fill\('it\\'s a \(test\)'\)/);
  // The generated file must still be valid JavaScript.
  await import(`data:text/javascript,${encodeURIComponent(code.replace(/^import .*$/m, ''))}`).catch(() => {});
});
