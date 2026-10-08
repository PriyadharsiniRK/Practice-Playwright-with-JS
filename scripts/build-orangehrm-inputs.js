/**
 * Regenerates the OrangeHRM sample manual test case documents in input/.
 *
 *   npm run build:inputs
 *
 * These deliberately look like the YouTube ones: same Excel columns, same Word
 * layout. Only the sentences differ - which is the point. Nothing about the
 * input format is application-specific.
 */

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const OUTPUT_DIR = 'input';
const SITE = 'https://opensource-demo.orangehrmlive.com';

export const TEST_CASES = [
  {
    id: 'TC-OHRM-001',
    title: 'Log in with valid credentials',
    preconditions: ['The demo instance is reachable.', 'Admin credentials are known.'],
    steps: [
      { text: `Open ${SITE}`, expected: 'The login page is displayed' },
      { text: 'Enter "Admin" in the Username field', expected: 'Username is entered' },
      { text: 'Enter "admin123" in the Password field', expected: 'Password is entered' },
      { text: 'Click the Login button', expected: 'Credentials are submitted' },
      { text: 'Verify that the dashboard is displayed', expected: 'The URL contains /dashboard' },
      { text: 'Verify that the dashboard heading is visible', expected: 'The header reads Dashboard' },
    ],
  },
  {
    id: 'TC-OHRM-002',
    title: 'Reject invalid credentials',
    preconditions: ['The demo instance is reachable.'],
    steps: [
      { text: `Open ${SITE}`, expected: 'The login page is displayed' },
      { text: 'Enter "Admin" in the Username field', expected: 'Username is entered' },
      { text: 'Enter "wrong-password" in the Password field', expected: 'Password is entered' },
      { text: 'Click the Login button', expected: 'Credentials are submitted' },
      { text: 'Verify that the login error message is visible', expected: 'Invalid credentials is shown' },
      { text: 'Verify that the URL contains "/auth/login"', expected: 'The user stays on the login page' },
    ],
  },
  {
    id: 'TC-OHRM-003',
    title: 'Navigate to the PIM module',
    preconditions: ['The demo instance is reachable.', 'Admin credentials are known.'],
    steps: [
      { text: `Open ${SITE}`, expected: 'The login page is displayed' },
      { text: 'Enter "Admin" in the Username field', expected: 'Username is entered' },
      { text: 'Enter "admin123" in the Password field', expected: 'Password is entered' },
      { text: 'Click the Login button', expected: 'Credentials are submitted' },
      { text: 'Verify that the dashboard is displayed', expected: 'The URL contains /dashboard' },
      { text: 'Click the PIM menu item', expected: 'The PIM module opens' },
      { text: 'Verify that the URL contains "/pim"', expected: 'The PIM page is shown' },
      { text: 'Verify that the user profile dropdown is visible', expected: 'The signed-in user is shown' },
    ],
  },
];

async function buildExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'playwright-test-generator';
  const sheet = workbook.addWorksheet('ManualTestCases');

  sheet.columns = [
    { header: 'TestCaseID', key: 'id', width: 16 },
    { header: 'Title', key: 'title', width: 34 },
    { header: 'Preconditions', key: 'preconditions', width: 40 },
    { header: 'Step', key: 'step', width: 54 },
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
      text: 'OrangeHRM - Manual Test Cases',
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

  fs.writeFileSync(filePath, await Packer.toBuffer(new Document({ sections: [{ children }] })));
  return filePath;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
console.log(`Wrote ${await buildExcel(path.join(OUTPUT_DIR, 'orangehrm-tests.xlsx'))}`);
console.log(`Wrote ${await buildWord(path.join(OUTPUT_DIR, 'orangehrm-tests.docx'))}`);
