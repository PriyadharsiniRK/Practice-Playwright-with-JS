/**
 * Excel parser.
 *
 * Expected layout: a single header row followed by one row per manual step.
 * Rows that share a TestCaseID are grouped into one test case, in sheet order.
 *
 *   | TestCaseID | Title | Preconditions | Step | ExpectedResult |
 *
 * Column names are matched case/spacing insensitively and a few common aliases
 * are accepted, but the layout itself is intentionally fixed - supporting
 * arbitrary spreadsheet shapes is a non-goal.
 */

import ExcelJS from 'exceljs';
import { ErrorCode, fail } from '../errors.js';
import { RawTestCaseSchema } from '../model/testCaseSchema.js';

const COLUMN_ALIASES = {
  id: ['testcaseid', 'testid', 'id', 'tcid'],
  title: ['title', 'testcasetitle', 'name', 'summary'],
  preconditions: ['preconditions', 'precondition', 'pre'],
  step: ['step', 'steps', 'stepdescription', 'action', 'teststep'],
  expected: ['expectedresult', 'expected', 'expectedresults', 'result'],
};

const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Excel cells can be rich text, formulas or hyperlinks - flatten them to text. */
function cellText(cell) {
  const value = cell?.value;
  if (value == null) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
    if (value.text != null) return String(value.text);
    if (value.result != null) return String(value.result);
    if (value.hyperlink) return String(value.hyperlink);
  }
  return String(value).trim();
}

function mapHeaderRow(row) {
  const columns = {};
  row.eachCell((cell, colNumber) => {
    const header = normalize(cellText(cell));
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(header)) columns[field] = colNumber;
    }
  });
  return columns;
}

/**
 * @param {string} filePath path to a .xlsx workbook
 * @returns {Promise<Array<import('zod').infer<typeof RawTestCaseSchema>>>}
 */
export async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch (error) {
    fail(ErrorCode.INVALID_TEST_CASE, `Could not read Excel workbook "${filePath}": ${error.message}`);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    fail(ErrorCode.INVALID_TEST_CASE, `Workbook "${filePath}" contains no worksheets.`);
  }

  const columns = mapHeaderRow(sheet.getRow(1));
  const missing = ['id', 'title', 'step'].filter((field) => !columns[field]);
  if (missing.length > 0) {
    fail(
      ErrorCode.INVALID_TEST_CASE,
      `Worksheet "${sheet.name}" is missing required column(s): ${missing.join(', ')}.`,
      { hint: 'Expected header row: TestCaseID | Title | Preconditions | Step | ExpectedResult' },
    );
  }

  /** @type {Map<string, any>} */
  const cases = new Map();

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const id = cellText(row.getCell(columns.id)).trim();
    const stepText = cellText(row.getCell(columns.step)).trim();
    if (!id && !stepText) return; // blank spacer row

    if (!id) {
      fail(ErrorCode.INVALID_TEST_CASE, `Row ${rowNumber} in "${sheet.name}" has a step but no TestCaseID.`);
    }
    if (!stepText) {
      fail(ErrorCode.INVALID_TEST_CASE, `Row ${rowNumber} of test case ${id} has an empty Step cell.`);
    }

    if (!cases.has(id)) {
      cases.set(id, {
        id,
        title: cellText(row.getCell(columns.title)).trim() || id,
        preconditions: [],
        steps: [],
        source: filePath,
      });
    }
    const testCase = cases.get(id);

    if (columns.preconditions) {
      const precondition = cellText(row.getCell(columns.preconditions)).trim();
      if (precondition && !testCase.preconditions.includes(precondition)) {
        testCase.preconditions.push(precondition);
      }
    }

    const expected = columns.expected ? cellText(row.getCell(columns.expected)).trim() : '';
    testCase.steps.push({
      stepNumber: testCase.steps.length + 1,
      text: stepText,
      ...(expected ? { expected } : {}),
    });
  });

  if (cases.size === 0) {
    fail(ErrorCode.INVALID_TEST_CASE, `No test cases found in "${filePath}".`);
  }

  return [...cases.values()].map((testCase) => RawTestCaseSchema.parse(testCase));
}
