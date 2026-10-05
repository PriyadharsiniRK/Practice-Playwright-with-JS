/**
 * Unit tests for the Word parser's tolerance of how people actually number
 * steps.
 *
 * Each case builds a real .docx in a temporary directory and parses it, rather
 * than testing the regex in isolation - the thing worth asserting is that a
 * document a tester could plausibly hand you comes out with its steps intact.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Document, Packer, Paragraph } from 'docx';

import { parseWord } from '../src/parser/wordParser.js';

/** Writes a one-test-case document whose step lines are given verbatim. */
async function docWithSteps(stepLines) {
  const children = [
    new Paragraph({ text: 'Test Case ID: TC-X-001' }),
    new Paragraph({ text: 'Title: A case' }),
    new Paragraph({ text: 'Precondition: None' }),
    new Paragraph({ text: 'Steps:' }),
    ...stepLines.map((line) => new Paragraph({ text: line })),
  ];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'word-parser-'));
  const file = path.join(dir, 'case.docx');
  fs.writeFileSync(file, await Packer.toBuffer(new Document({ sections: [{ children }] })));
  return file;
}

test('"1. Open ..." - a space after the number', async () => {
  const [testCase] = await parseWord(await docWithSteps(['1. Open https://example.com', '2. Click Login']));
  assert.deepEqual(
    testCase.steps.map((step) => step.text),
    ['Open https://example.com', 'Click Login'],
  );
});

test('"1) Open ..." - a bracket instead of a dot', async () => {
  const [testCase] = await parseWord(await docWithSteps(['1) Open https://example.com']));
  assert.equal(testCase.steps[0].text, 'Open https://example.com');
});

test('"1.Open ..." - no space at all, as people type it', async () => {
  const [testCase] = await parseWord(await docWithSteps(['1.Open https://example.com', '2.click on login']));
  assert.equal(testCase.steps.length, 2);
  assert.equal(testCase.steps[0].text, 'Open https://example.com');
  assert.equal(testCase.steps[1].text, 'click on login');
  assert.equal(testCase.steps[1].stepNumber, 2);
});

test('decimal sub-numbering is refused rather than silently renumbered', async () => {
  // "1.1 Open ..." must not become step 1 with the text "1 Open ...". Sub-steps
  // are unsupported; reading them wrong would be worse than saying so.
  const file = await docWithSteps(['1.1 Open https://example.com']);
  await assert.rejects(() => parseWord(file), /no numbered steps/);
});
