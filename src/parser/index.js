/** Dispatches to the right document parser based on file extension. */

import path from 'node:path';
import fs from 'node:fs';
import { ErrorCode, fail } from '../errors.js';
import { parseExcel } from './excelParser.js';
import { parseWord } from './wordParser.js';

export { parseExcel, parseWord };

export const SUPPORTED_EXTENSIONS = ['.xlsx', '.xlsm', '.docx'];

/**
 * @param {string} filePath Excel or Word manual test case document
 * @returns {Promise<Array<object>>} raw (uninterpreted) test cases
 */
export async function parseDocument(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(ErrorCode.INVALID_TEST_CASE, `Input file not found: ${filePath}`);
  }
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.xlsx':
    case '.xlsm':
      return parseExcel(filePath);
    case '.docx':
      return parseWord(filePath);
    default:
      return fail(
        ErrorCode.INVALID_TEST_CASE,
        `Unsupported input format "${extension || filePath}".`,
        { hint: `Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}` },
      );
  }
}

/** Finds one test case by id across a set of parsed documents. */
export function selectTestCase(testCases, id) {
  if (!id) return testCases;
  const match = testCases.filter((testCase) => testCase.id.toLowerCase() === id.toLowerCase());
  if (match.length === 0) {
    fail(ErrorCode.INVALID_TEST_CASE, `Test case "${id}" was not found.`, {
      hint: `Available test cases: ${testCases.map((t) => t.id).join(', ') || '(none)'}`,
    });
  }
  return match;
}
