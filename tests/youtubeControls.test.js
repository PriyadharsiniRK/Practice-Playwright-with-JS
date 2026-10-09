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

test('"Close the cookie consent dialog if it is displayed" is an optional DISMISS step', async () => {
  const canonical = await analyzeTestCase(
    {
      id: 'TC-YT-CONSENT',
      title: 'Consent',
      steps: [
        { stepNumber: 1, text: 'Open https://www.youtube.com' },
        { stepNumber: 2, text: 'Close the cookie consent dialog if it is displayed' },
      ],
    },
    { provider: createProvider('heuristic') },
  );
  assert.equal(canonical.steps[1].action, 'DISMISS');
  assert.equal(resolveTarget(canonical.steps[1].target, applicationById('youtube')).catalogId, 'youtube.consentDialog');

  const { code } = generateSpec(canonical, { screenshots: false });
  // Keyed on the close button: the <ytd-consent-bump-v2-lightbox> element has
  // no box of its own, so Playwright never considers the dialog itself visible.
  assert.match(code, /page\.locator\('ytd-consent-bump-v2-lightbox button, form\[action\*="consent\.youtube\.com"\] button'\)/);
  assert.match(code, /\.filter\(\{ hasText: \/reject all\|accept all\|/);
  // Optional: clicks only when the dialog appears, never fails when it does not.
  assert.match(code, /if \(await closeButton\.waitFor\(\{ timeout: 10_000 \}\)\.then\(\(\) => true, \(\) => false\)\) \{/);
  assert.match(code, /await closeButton\.click\(\);/);
});

test('"Skip the ad if it is displayed" waits out skippable and unskippable ads', async () => {
  const canonical = await analyzeTestCase(
    {
      id: 'TC-YT-AD',
      title: 'Ad',
      steps: [
        { stepNumber: 1, text: 'Open https://www.youtube.com' },
        { stepNumber: 2, text: 'Skip the ad if it is displayed' },
      ],
    },
    { provider: createProvider('heuristic') },
  );
  assert.equal(canonical.steps[1].action, 'DISMISS');
  assert.equal(resolveTarget(canonical.steps[1].target, applicationById('youtube')).catalogId, 'youtube.skipAdButton');
  const { code } = generateSpec(canonical, { screenshots: false });
  // Waits while any ad plays, skippable or not, clicking Skip when offered.
  assert.match(code, /const showing = page\.locator\('#movie_player\.ad-showing'\);/);
  assert.match(code, /if \(await closeButton\.isVisible\(\)\) await closeButton\.click\(\);/);
  assert.match(code, /await expect\(showing\)\.toHaveCount\(0, \{ timeout: 1_000 \}\);/);
  // Still gone 2 seconds later: a gap between two ads is not the end.
  assert.match(code, /await page\.waitForTimeout\(2_000\);\n\s*expect\(await showing\.count\(\)\)\.toBe\(0\);/);
  assert.match(code, /\}\)\.toPass\(\{ timeout: 90_000 \}\);/);
});

test('text checks on YouTube icon buttons read the accessible name, whole words only', async () => {
  const canonical = await analyzeTestCase(
    {
      id: 'TC-YT-MUTE',
      title: 'Mute',
      steps: [
        { stepNumber: 1, text: 'Open https://www.youtube.com' },
        { stepNumber: 2, text: 'Verify that the Mute button contains "Mute"' },
      ],
    },
    { provider: createProvider('heuristic') },
  );
  const { code } = generateSpec(canonical, { screenshots: false });
  // "Mute" must not also match "Unmute".
  assert.match(code, /expect\(page\.locator\('#movie_player \.ytp-mute-button'\)\)\.toHaveAccessibleName\(\/\\bMute\\b\/i\)/);
  assert.doesNotMatch(code, /toContainText/);
});
