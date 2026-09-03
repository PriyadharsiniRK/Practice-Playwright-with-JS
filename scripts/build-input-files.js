/**
 * Regenerates the sample manual test case documents in input/.
 *
 * The .xlsx and .docx files are committed so the repository can be cloned and
 * demoed immediately; this script is what produced them.
 *
 *   npm run build:inputs
 */

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const OUTPUT_DIR = 'input';

/** The manual test cases, exactly as a manual tester would have written them. */
export const TEST_CASES = [
  {
    id: 'TC-YT-001',
    title: 'Search for a video on YouTube',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
    ],
  },
  {
    id: 'TC-YT-002',
    title: 'Verify YouTube homepage',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Verify that the YouTube logo is visible', expected: 'The logo is shown in the header' },
      { text: 'Verify that the search box is visible', expected: 'The search box is shown in the header' },
      { text: 'Verify that the page title contains "YouTube"', expected: 'Browser tab reads YouTube' },
    ],
  },
  {
    id: 'TC-YT-003',
    title: 'Search and open a video',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Enter "Playwright testing tutorial" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video player is visible', expected: 'The player is rendered' },
      { text: 'Verify that the page title contains "YouTube"', expected: 'Browser tab reads YouTube' },
    ],
  },
  {
    id: 'TC-YT-004',
    title: 'Search, open a video and go back to the results',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
      { text: 'Navigate back', expected: 'The browser returns to the search results' },
      { text: 'Verify that the URL contains "/results"', expected: 'The search results page is shown again' },
    ],
  },
];

async function buildExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'playwright-test-generator';
  const sheet = workbook.addWorksheet('ManualTestCases');

  sheet.columns = [
    { header: 'TestCaseID', key: 'id', width: 14 },
    { header: 'Title', key: 'title', width: 34 },
    { header: 'Preconditions', key: 'preconditions', width: 26 },
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
      text: 'YouTube - Manual Test Cases',
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
const excelPath = await buildExcel(path.join(OUTPUT_DIR, 'youtube-tests.xlsx'));
const wordPath = await buildWord(path.join(OUTPUT_DIR, 'youtube-tests.docx'));
console.log(`Wrote ${excelPath}`);
console.log(`Wrote ${wordPath}`);
