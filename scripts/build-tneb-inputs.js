/**
 * Regenerates input/tneb-tests.xlsx and input/tneb-tests.docx.
 *
 *   node scripts/build-tneb-inputs.js
 *
 * These are a rework of a hand-written EB document (input/EB-tests.docx) whose
 * single test case drove the e-Invoice download. Three things changed, and each
 * one is a rule about what a manual test case has to be before it can be
 * automated at all.
 *
 * The cases are numbered TC-TNEB-* rather than TC-EB-*. The hand-written
 * document is still in the repository and still owns TC-EB-001; two documents
 * sharing a test case id would overwrite each other's generated spec, and
 * whichever ran last would win silently. The rework is a companion to that
 * document, not a replacement for it - the original is worth keeping precisely
 * because the three rules below are easier to see side by side.
 *
 *   1. The site is opened in English. The original step 1 said
 *      `?locale=ta`, which serves the portal in Tamil: every label, and so
 *      every accessible name, is Tamil text. Steps 3 to 6 then asked for
 *      "Consumer No", "Registered Mobile No" and "Download in English" -
 *      English names that cannot exist on that page. The test case asked for
 *      two incompatible things and was red at step 3 for exactly that reason.
 *      Automating the Tamil portal is perfectly possible; it needs the Tamil
 *      labels in the steps and in src/generator/applications/tneb.js.
 *
 *   2. It states expected results. The original stopped at "click Download in
 *      English" and asserted nothing, so the generated test passed as long as
 *      six clicks and keystrokes did not throw - including when no bill came
 *      back at all. A test case with no Verify step cannot fail, which makes it
 *      worth nothing. TC-TNEB-001 now ends by checking the invoice is there.
 *
 *   3. No real account details. The original carried what look like a genuine
 *      12-digit consumer number and the mobile number registered against it.
 *      Test documents get committed, mailed and pasted into chat. The numbers
 *      below are made up; put your own in the document locally to run it
 *      against the live portal, and do not commit them.
 */

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const OUTPUT_DIR = 'input';

/** The portal, in English. See rule 1 above for why the locale is explicit. */
const PORTAL = 'https://www.tnebnet.org/awp/login?locale=en';

/** Invented account details. See rule 3 above. */
const CONSUMER_NO = '123456789012';
const MOBILE_NO = '9000000000';
const BILL_MONTH = '092026';

/** The manual test cases, as a tester would have written them. */
export const TEST_CASES = [
  {
    id: 'TC-TNEB-001',
    title: 'Download an e-Invoice',
    preconditions: ['User has internet access.'],
    steps: [
      { text: `Open ${PORTAL}`, expected: 'The EB login page is displayed' },
      { text: 'Click the e-Invoice link', expected: 'The e-Invoice form is displayed' },
      { text: `Enter "${CONSUMER_NO}" in the Consumer No box`, expected: 'The consumer number is entered' },
      { text: `Enter "${MOBILE_NO}" in the Registered Mobile No box`, expected: 'The mobile number is entered' },
      { text: `Enter "${BILL_MONTH}" in the Bill Month/Year box`, expected: 'The billing month is entered' },
      { text: 'Click the Download in English button', expected: 'The invoice is produced' },
      { text: 'Verify that the invoice summary is visible', expected: 'The bill is shown' },
      { text: `Verify that the invoice summary contains "${CONSUMER_NO}"`, expected: 'The bill is for this consumer' },
      { text: 'Verify that the error message is not visible', expected: 'Nothing was rejected' },
    ],
  },
  {
    id: 'TC-TNEB-002',
    title: 'The e-Invoice form is reachable without signing in',
    preconditions: ['User has internet access.', 'User is not signed in.'],
    steps: [
      { text: `Open ${PORTAL}`, expected: 'The EB login page is displayed' },
      { text: 'Verify that the e-Invoice tab is visible', expected: 'The tab is offered in the tab strip' },
      { text: 'Verify that the Consumer No box is not visible', expected: 'The form is behind the tab' },
      { text: 'Click the e-Invoice link', expected: 'The e-Invoice form opens' },
      { text: 'Verify that the Consumer No box is visible', expected: 'The form is now shown' },
      { text: 'Verify that the Download in English button is visible', expected: 'Both download options are offered' },
    ],
  },
  {
    id: 'TC-TNEB-003',
    title: 'Malformed details return no invoice',
    preconditions: ['User has internet access.'],
    steps: [
      { text: `Open ${PORTAL}`, expected: 'The EB login page is displayed' },
      { text: 'Click the e-Invoice link', expected: 'The e-Invoice form is displayed' },
      { text: 'Enter "12345" in the Consumer No box', expected: 'A too-short consumer number is entered' },
      { text: `Enter "${MOBILE_NO}" in the Registered Mobile No box`, expected: 'The mobile number is entered' },
      { text: `Enter "${BILL_MONTH}" in the Bill Month/Year box`, expected: 'The billing month is entered' },
      { text: 'Click the Download in English button', expected: 'The request is rejected' },
      { text: 'Verify that the error message is visible', expected: 'The rejection is explained' },
      { text: 'Verify that the invoice summary is not visible', expected: 'No bill is shown' },
    ],
  },
];

async function buildExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'playwright-test-generator';
  const sheet = workbook.addWorksheet('ManualTestCases');

  sheet.columns = [
    { header: 'TestCaseID', key: 'id', width: 14 },
    { header: 'Title', key: 'title', width: 44 },
    { header: 'Preconditions', key: 'preconditions', width: 34 },
    { header: 'Step', key: 'step', width: 62 },
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
      text: 'TNEB (EB website) - Manual Test Cases',
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
const excelPath = await buildExcel(path.join(OUTPUT_DIR, 'tneb-tests.xlsx'));
const wordPath = await buildWord(path.join(OUTPUT_DIR, 'tneb-tests.docx'));
console.log(`Wrote ${excelPath}`);
console.log(`Wrote ${wordPath}`);
