/**
 * Builds input/sample-tests.docx from input/sample-tests.xlsx.
 *
 * The SauceDemo test cases were supplied as a spreadsheet, so the spreadsheet
 * stays the source of truth and the Word copy is derived from it. Re-run this
 * after editing the spreadsheet so the two documents never drift apart:
 *
 *   node scripts/build-saucedemo-docx.js
 *
 * The output follows the Word layout documented in the README (Test Case ID,
 * Title, Precondition, Steps, numbered steps with optional Expected lines), so
 * both documents parse to the same test cases.
 */

import fs from 'node:fs';
import path from 'node:path';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { parseDocument } from '../src/parser/index.js';

const SOURCE = path.join('input', 'sample-tests.xlsx');
const TARGET = path.join('input', 'sample-tests.docx');

const testCases = await parseDocument(SOURCE);

const children = [
  new Paragraph({
    text: 'SauceDemo - Manual Test Cases',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
  }),
];

for (const testCase of testCases) {
  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: `Test Case ID: ${testCase.id}`, bold: true })] }),
    new Paragraph({ text: `Title: ${testCase.title}` }),
    // One line per precondition, so the Word parser rebuilds the same list.
    ...testCase.preconditions.map((precondition) => new Paragraph({ text: `Precondition: ${precondition}` })),
    new Paragraph({ text: 'Steps:' }),
  );
  for (const step of testCase.steps) {
    children.push(new Paragraph({ text: `${step.stepNumber}. ${step.text}` }));
    if (step.expected) children.push(new Paragraph({ text: `Expected: ${step.expected}` }));
  }
}

const document = new Document({ sections: [{ children }] });
fs.writeFileSync(TARGET, await Packer.toBuffer(document));
console.log(`Wrote ${TARGET} (${testCases.length} test cases from ${SOURCE})`);
