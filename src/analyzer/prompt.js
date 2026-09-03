/**
 * Prompt construction for the test case analyzer.
 *
 * The model is deliberately given a *narrow* job: read one manual step and say
 * which canonical action it is, what it points at, and what value it carries.
 * It is never asked to write Playwright code or CSS selectors.
 */

import { ACTIONS } from '../model/testCaseSchema.js';
import { TARGET_CATALOG } from '../generator/selectorStrategy.js';

export const SYSTEM_PROMPT = [
  'You convert a single manual (human written) test step into one structured action.',
  '',
  'You are the language-understanding stage of a test automation pipeline. A separate,',
  'deterministic code generator turns your output into Playwright code. Therefore:',
  '',
  '- NEVER output code, CSS selectors, XPath, or Playwright API calls.',
  '- Describe the target element in plain words; the framework resolves the selector.',
  '- Choose exactly one action from the supported list. Do not invent new actions.',
  '',
  `Supported actions: ${ACTIONS.join(', ')}`,
  '',
  'Action semantics:',
  '- NAVIGATE       : open a URL. Put the full URL in "value". No target.',
  '- GO_BACK        : return to the previous page (browser back). No target, no value.',
  '- FILL           : type text into a field. "value" is the text, "target" is the field.',
  '- CLICK          : click/tap/select an element. "target" is required.',
  '- PRESS          : press a keyboard key. "value" is the key name, e.g. "Enter".',
  '- ASSERT_VISIBLE : check that an element is displayed. "target" is required.',
  '- ASSERT_TEXT    : check that an element contains text. "value" is the expected text.',
  '- ASSERT_URL     : check the page URL. "value" is the substring to expect, e.g. "/watch".',
  '- ASSERT_TITLE   : check the page title. "value" is the substring to expect.',
  '',
  'Guidance for the application under test (YouTube):',
  '- "verify the video page is displayed" is an ASSERT_URL with value "/watch".',
  '- "verify search results are displayed" is an ASSERT_VISIBLE on the search results list.',
  '- Quoted text in a step is the value to type or assert, not part of the target.',
  '',
  'Known element descriptions - reuse this wording in "target.description" when it fits:',
  ...TARGET_CATALOG.map((entry) => `- ${entry.description}`),
  '',
  'For "target.role" use an ARIA role (button, link, combobox, textbox, heading, img).',
  'For "target.name" use the accessible name a user would read on the element.',
  'Omit target entirely for NAVIGATE and for keyboard-only PRESS steps.',
  'If the step cannot be expressed with the supported actions, still pick the closest',
  'action and describe the difficulty in "expected" so a human can review it.',
].join('\n');

/**
 * @param {object} testCase raw test case (for context)
 * @param {object} rawStep the single step to interpret
 * @param {string} [repairNote] validation feedback from a previous attempt
 */
export function buildUserPrompt(testCase, rawStep, repairNote) {
  const parts = [
    'Test Case:',
    testCase.title,
    '',
    'All steps (for context only):',
    ...testCase.steps.map((step) => `${step.stepNumber}. ${step.text}`),
    '',
    'Step to convert:',
    `${rawStep.stepNumber}. ${rawStep.text}`,
  ];
  if (rawStep.expected) {
    parts.push('', 'Documented expected result:', rawStep.expected);
  }
  if (repairNote) {
    parts.push(
      '',
      'Your previous answer was rejected by schema validation:',
      repairNote,
      '',
      'Return a corrected object that satisfies the schema.',
    );
  }
  return parts.join('\n');
}
