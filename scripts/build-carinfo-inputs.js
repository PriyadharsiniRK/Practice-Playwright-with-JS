/**
 * Regenerates input/carinfo-tests.xlsx and input/carinfo-tests.docx.
 *
 *   node scripts/build-carinfo-inputs.js
 *
 * These are a rework of a hand-written document whose test case drove Google
 * sign-in and used conditional steps. Three things changed, and each is worth
 * knowing because each is a rule about what a manual test case has to be before
 * it can be automated at all:
 *
 *   1. No sign-in. The original signed in with Google. OAuth is built to resist
 *      automation, so a test case driving it fails for reasons unrelated to the
 *      application under test. TC-CI-003 instead asserts that a signed-out
 *      visitor is offered sign-in, which is the part worth checking.
 *
 *   2. No conditional steps. "If it further requests for access, click on
 *      Continue" cannot be automated as written: a test that does different
 *      things on different runs cannot be asserted about. Such a step becomes a
 *      deterministic precondition, or an explicit assertion that the dialog is
 *      absent - which is what TC-CI-003's last step does.
 *
 *   3. No credentials. The original carried a real address and password. Test
 *      documents get committed, mailed and pasted into chat; secrets in them
 *      are secrets published.
 *
 * One action per step, too: the original asked for a username *and* a password
 * in a single step, which the canonical model has no way to express.
 */

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const OUTPUT_DIR = 'input';

/** The manual test cases, as a tester would have written them. */
export const TEST_CASES = [
  {
    id: 'TC-CI-001',
    title: 'Look up a vehicle by registration number',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://car.info', expected: 'The car.info homepage is displayed' },
      { text: 'Enter "KFG40L" in the registration number box', expected: 'The plate is entered' },
      { text: 'Click the Search button', expected: 'The lookup is submitted' },
      { text: 'Verify that the vehicle page is displayed', expected: 'The URL contains /search' },
      { text: 'Verify that vehicle details are displayed', expected: 'The details card is shown' },
      { text: 'Verify that the vehicle title contains "KFG40L"', expected: 'The heading names the plate' },
    ],
  },
  {
    id: 'TC-CI-002',
    title: 'Verify the CarInfo homepage',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://car.info', expected: 'The car.info homepage is displayed' },
      { text: 'Verify that the car.info logo is visible', expected: 'The logo is shown in the header' },
      { text: 'Verify that the registration number box is visible', expected: 'The search box is shown' },
      { text: 'Verify that the page title contains "car.info"', expected: 'Browser tab reads car.info' },
    ],
  },
  {
    id: 'TC-CI-003',
    title: 'A signed-out visitor is offered sign-in',
    preconditions: ['User has internet access.', 'User is not signed in.'],
    steps: [
      { text: 'Open https://car.info', expected: 'The car.info homepage is displayed' },
      { text: 'Verify that the Log in link is visible', expected: 'Sign-in is offered in the header' },
      { text: 'Verify that the vehicle details are not displayed', expected: 'No vehicle is shown yet' },
    ],
  },
  {
    id: 'TC-CI-004',
    title: 'An unknown registration number returns no vehicle',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://car.info', expected: 'The car.info homepage is displayed' },
      { text: 'Enter "ZZZ999" in the registration number box', expected: 'The plate is entered' },
      { text: 'Click the Search button', expected: 'The lookup is submitted' },
      { text: 'Verify that search results are displayed', expected: 'The results area is shown' },
      { text: 'Verify that the vehicle details are not displayed', expected: 'No details card is rendered' },
    ],
  },
];

async function buildExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'playwright-test-generator';
  const sheet = workbook.addWorksheet('ManualTestCases');

  sheet.columns = [
    { header: 'TestCaseID', key: 'id', width: 14 },
    { header: 'Title', key: 'title', width: 42 },
    { header: 'Preconditions', key: 'preconditions', width: 34 },
    { header: 'Step', key: 'step', width: 52 },
    { header: 'ExpectedResult', key: 'expected', width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (const testCase of TEST_CASES) {
    for (const step of testCase.steps) {
      sheet.addRow({
        id: testCase.id,
        title: testCase.title,
        preconditions: testCase.preconditions.join(' '),
        step: step.text,
        expected: step.expected,
      });
    }
  }

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

async function buildWord(filePath) {
  const children = [
    new Paragraph({
      text: 'car.info - Manual Test Cases',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
    }),
  ];

  for (const testCase of TEST_CASES) {
    children.push(
      new Paragraph({ text: '' }),
      new Paragraph({ children: [new TextRun({ text: `Test Case ID: ${testCase.id}`, bold: true })] }),
      new Paragraph({ text: `Title: ${testCase.title}` }),
      new Paragraph({ text: `Precondition: ${testCase.preconditions.join(' ')}` }),
      new Paragraph({ text: 'Steps:' }),
    );
    testCase.steps.forEach((step, index) => {
      children.push(new Paragraph({ text: `${index + 1}. ${step.text}` }));
      if (step.expected) children.push(new Paragraph({ text: `Expected: ${step.expected}` }));
    });
  }

  const document = new Document({ sections: [{ children }] });
  fs.writeFileSync(filePath, await Packer.toBuffer(document));
  return filePath;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const excelPath = await buildExcel(path.join(OUTPUT_DIR, 'carinfo-tests.xlsx'));
const wordPath = await buildWord(path.join(OUTPUT_DIR, 'carinfo-tests.docx'));
console.log(`Wrote ${excelPath}`);
console.log(`Wrote ${wordPath}`);
