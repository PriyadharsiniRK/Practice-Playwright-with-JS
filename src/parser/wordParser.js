/**
 * Word (.docx) parser.
 *
 * Expected structure - one block per test case, in this order:
 *
 *   Test Case ID: TC-YT-001
 *   Title: Search for a video on YouTube
 *   Precondition: User has internet access.
 *   Steps:
 *   1. Open https://www.youtube.com
 *      Expected: YouTube homepage is displayed
 *   2. Enter "Playwright automation" in the search box
 *
 * "Expected:" lines are optional and attach to the step above them. Anything
 * that does not match one of these prefixes is ignored, so headings and blank
 * lines in the document are harmless.
 */

import mammoth from 'mammoth';
import { ErrorCode, fail } from '../errors.js';
import { RawTestCaseSchema } from '../model/testCaseSchema.js';

const ID_LINE = /^test\s*case\s*id\s*[:\-]\s*(.+)$/i;
const TITLE_LINE = /^title\s*[:\-]\s*(.*)$/i;
const PRECONDITION_LINE = /^pre[- ]?conditions?\s*[:\-]\s*(.*)$/i;
const STEPS_HEADING = /^steps?\s*[:\-]?\s*$/i;
const STEP_LINE = /^(\d+)[.)]\s+(.+)$/;
const EXPECTED_LINE = /^expected(?:\s*result)?\s*[:\-]\s*(.+)$/i;

/**
 * @param {string} filePath path to a .docx document
 * @returns {Promise<Array<import('zod').infer<typeof RawTestCaseSchema>>>}
 */
export async function parseWord(filePath) {
  let text;
  try {
    ({ value: text } = await mammoth.extractRawText({ path: filePath }));
  } catch (error) {
    fail(ErrorCode.INVALID_TEST_CASE, `Could not read Word document "${filePath}": ${error.message}`);
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const cases = [];
  let current = null;
  // Which field a bare continuation line belongs to.
  let section = null;

  const push = () => {
    if (!current) return;
    if (current.steps.length === 0) {
      fail(ErrorCode.INVALID_TEST_CASE, `Test case ${current.id} in "${filePath}" has no numbered steps.`);
    }
    if (!current.title) current.title = current.id;
    cases.push(current);
  };

  for (const line of lines) {
    if (!line) continue;

    const idMatch = line.match(ID_LINE);
    if (idMatch) {
      push();
      current = { id: idMatch[1].trim(), title: '', preconditions: [], steps: [], source: filePath };
      section = null;
      continue;
    }
    if (!current) continue; // preamble before the first test case

    const titleMatch = line.match(TITLE_LINE);
    if (titleMatch) {
      current.title = titleMatch[1].trim();
      section = titleMatch[1].trim() ? null : 'title';
      continue;
    }

    const preconditionMatch = line.match(PRECONDITION_LINE);
    if (preconditionMatch) {
      if (preconditionMatch[1].trim()) current.preconditions.push(preconditionMatch[1].trim());
      section = 'preconditions';
      continue;
    }

    if (STEPS_HEADING.test(line)) {
      section = 'steps';
      continue;
    }

    const stepMatch = line.match(STEP_LINE);
    if (stepMatch) {
      current.steps.push({ stepNumber: current.steps.length + 1, text: stepMatch[2].trim() });
      section = 'steps';
      continue;
    }

    const expectedMatch = line.match(EXPECTED_LINE);
    if (expectedMatch && current.steps.length > 0) {
      current.steps.at(-1).expected = expectedMatch[1].trim();
      continue;
    }

    // Continuation of a multi-line Title/Precondition block.
    if (section === 'title' && !current.title) current.title = line;
    else if (section === 'preconditions') current.preconditions.push(line);
  }
  push();

  if (cases.length === 0) {
    fail(ErrorCode.INVALID_TEST_CASE, `No test cases found in "${filePath}".`, {
      hint: 'Each test case must start with a line like "Test Case ID: TC-YT-001".',
    });
  }

  return cases.map((testCase) => RawTestCaseSchema.parse(testCase));
}
