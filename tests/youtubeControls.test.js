/**
 * Unit tests for the vocabulary the rewritten TC-YT-013..032 needed.
 *
 * Two new actions, and a set of player and page controls in the YouTube
 * catalog. The actions are here because they have an obvious Playwright
 * equivalent and a manual tester writes them unprompted; the targets are here
 * because a scenario that says "click Play" has to resolve to something.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { applicationById } from '../src/generator/applications/index.js';
import { resolveTarget } from '../src/generator/selectorStrategy.js';
import { generateSpec } from '../src/generator/playwrightGenerator.js';
import { analyzeTestCase, createProvider } from '../src/analyzer/testCaseAnalyzer.js';

const heuristic = createProvider('heuristic');
const youtube = applicationById('youtube');

const oneStep = (text) =>
  analyzeTestCase(
    { id: 'TC-X-001', title: 'Case', preconditions: [], steps: [{ stepNumber: 1, text }] },
    { provider: heuristic, application: youtube },
  );

const catalogId = (step) => resolveTarget(step.target, youtube).catalogId;

test('"Navigate forward" is its own action, not a mis-read of back', async () => {
  const forward = await oneStep('Navigate forward');
  assert.equal(forward.steps[0].action, 'GO_FORWARD');

  const back = await oneStep('Navigate back');
  assert.equal(back.steps[0].action, 'GO_BACK');

  const { code } = generateSpec({ ...forward, application: 'youtube' });
  assert.match(code, /await page\.goForward\(\);/);
});

test('"Clear the search box" empties the field rather than filling it', async () => {
  const canonical = await oneStep('Clear the search box');
  assert.equal(canonical.steps[0].action, 'CLEAR');
  assert.equal(catalogId(canonical.steps[0]), 'youtube.searchBox');

  const { code } = generateSpec({ ...canonical, application: 'youtube' });
  assert.match(code, /getByRole\('combobox'.*\)\.clear\(\);/);
  assert.doesNotMatch(code, /\.fill\(/);
});

test('the player and page controls resolve to their own catalog entries', async () => {
  for (const [text, expected] of [
    ['Click the Play button', 'youtube.playPauseButton'],
    ['Click the Mute button', 'youtube.muteButton'],
    ['Click the Full screen button', 'youtube.fullScreenButton'],
    ['Click the Show more button', 'youtube.showMoreButton'],
    ['Click the channel name link', 'youtube.channelLink'],
    ['Click the Like button', 'youtube.likeButton'],
    ['Click the Subscribe button', 'youtube.subscribeButton'],
    ['Verify that the Comments section is visible', 'youtube.commentsSection'],
    ['Verify that the no results message is visible', 'youtube.noResultsMessage'],
    ['Verify that the volume slider is visible', 'youtube.volumeSlider'],
    ['Verify that the sign-in prompt is visible', 'youtube.signInPrompt'],
    ['Verify that the channel page heading is visible', 'youtube.channelTitle'],
  ]) {
    const canonical = await oneStep(text);
    assert.equal(catalogId(canonical.steps[0]), expected, `"${text}"`);
  }
});

test('"channel page heading" is an element; "page title" is still the browser tab', async () => {
  // "channel page title" would be read as a document-title assertion, which is
  // why the test cases say heading. Guard the distinction.
  const heading = await oneStep('Verify that the channel page heading is visible');
  assert.equal(heading.steps[0].action, 'ASSERT_VISIBLE');

  const tab = await oneStep('Verify that the page title contains "YouTube"');
  assert.equal(tab.steps[0].action, 'ASSERT_TITLE');
  assert.equal(tab.steps[0].value, 'YouTube');
});

test('a toggle is asserted by the label it now shows', async () => {
  const canonical = await oneStep('Verify that the Mute button contains "Unmute"');
  assert.equal(canonical.steps[0].action, 'ASSERT_TEXT');
  assert.equal(canonical.steps[0].value, 'Unmute');
  assert.equal(catalogId(canonical.steps[0]), 'youtube.muteButton');
});

test('every YouTube spec dismisses the cookie consent dialog and page before any step', () => {
  const { code } = generateSpec({
    id: 'TC-YT-CONSENT',
    title: 'Consent',
    application: 'youtube',
    steps: [{ stepNumber: 1, originalText: 'Open https://www.youtube.com', action: 'NAVIGATE', value: 'https://www.youtube.com' }],
  });
  const handler = code.indexOf("page.addLocatorHandler(page.locator('ytd-consent-bump-v2-lightbox').first()");
  assert.ok(handler > 0, 'consent dialog handler missing');
  assert.match(code, /page\.addLocatorHandler\(page\.locator\('form\[action\*="consent\.youtube\.com"\]'\)\.first\(\)/);
  assert.match(code, /\.filter\(\{ hasText: \/reject all\|accept all\/i \}\)\.first\(\)\.click\(\)/);
  // Registered before the first step runs.
  assert.ok(handler < code.indexOf("test.step('Step 1"));
});

test('applications without interruptions get no locator handler', () => {
  const { code } = generateSpec({
    id: 'TC-OHRM-PLAIN',
    title: 'Plain',
    application: 'orangehrm',
    steps: [{ stepNumber: 1, originalText: 'Open the site', action: 'NAVIGATE', value: 'https://opensource-demo.orangehrmlive.com' }],
  });
  assert.doesNotMatch(code, /addLocatorHandler/);
});
