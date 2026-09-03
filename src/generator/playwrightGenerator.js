/**
 * Deterministic Playwright generator.
 *
 * Input:  a validated canonical TestCase
 * Output: the source of a runnable *.spec.js file
 *
 * No model is involved here. The same canonical test case always produces
 * byte-identical code, which is what makes the generated suite reviewable and
 * diffable in version control.
 */

import { ErrorCode, PipelineError, unsupportedAssertion } from '../errors.js';
import { TestCaseSchema } from '../model/testCaseSchema.js';
import { escapeRegExp, resolveTarget } from './selectorStrategy.js';

const INDENT = '  ';

/** Emits a single-quoted JS string literal. */
const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

/** A bare `/` would terminate the literal early - escape the ones that are not already escaped. */
const escapeSlashes = (source) => source.replace(/(^|[^\\])\//g, '$1\\/');

/** Emits a regex literal from `{ source, flags }` or from plain text. */
function regexLiteral(pattern) {
  if (pattern && typeof pattern === 'object' && 'source' in pattern) {
    return `/${escapeSlashes(pattern.source)}/${pattern.flags ?? ''}`;
  }
  return `/${escapeSlashes(escapeRegExp(String(pattern)))}/i`;
}

/** Turns a locator spec into Playwright locator source. */
export function emitLocator(spec) {
  let expression;
  switch (spec.kind) {
    case 'role': {
      const options = spec.name ? `, { name: ${regexLiteral(spec.name)} }` : '';
      expression = `page.getByRole(${quote(spec.role)}${options})`;
      break;
    }
    case 'label':
      expression = `page.getByLabel(${regexLiteral(spec.text)})`;
      break;
    case 'placeholder':
      expression = `page.getByPlaceholder(${regexLiteral(spec.text)})`;
      break;
    case 'text':
      expression = `page.getByText(${regexLiteral(spec.text)})`;
      break;
    case 'css':
      expression = `page.locator(${quote(spec.selector)})`;
      break;
    default:
      throw new PipelineError(ErrorCode.GENERATION_FAILED, `Unknown locator strategy "${spec.kind}".`);
  }
  if (spec.nth === 'first') expression += '.first()';
  else if (spec.nth === 'last') expression += '.last()';
  else if (typeof spec.nth === 'number') expression += `.nth(${spec.nth})`;
  return expression;
}

/**
 * Rewrites a NAVIGATE url onto a different origin. Used by the offline demo so
 * the very same canonical test case can run against a local stand-in.
 */
function applyBaseUrl(url, baseUrl) {
  if (!baseUrl) return url;
  try {
    const source = new URL(url);
    const target = new URL(baseUrl);
    target.pathname = source.pathname === '/' ? target.pathname : source.pathname;
    target.search = source.search;
    return target.toString();
  } catch {
    return url;
  }
}

/** Builds the statement(s) for one canonical step. */
function emitStep(step, options) {
  const lines = [`// Step ${step.stepNumber}: ${step.originalText}`];
  const locatorFor = () => emitLocator(resolveTarget(step.target).spec);

  switch (step.action) {
    case 'NAVIGATE': {
      const url = step.value ?? step.target?.description;
      if (!url) {
        throw new PipelineError(ErrorCode.GENERATION_FAILED, `Step ${step.stepNumber} is a NAVIGATE with no URL.`);
      }
      lines.push(`await page.goto(${quote(applyBaseUrl(url, options.baseUrl))});`);
      break;
    }
    case 'GO_BACK':
      lines.push('await page.goBack();');
      break;
    case 'CLICK':
      lines.push(`await ${locatorFor()}.click();`);
      break;
    case 'FILL': {
      if (step.value == null) {
        throw new PipelineError(ErrorCode.GENERATION_FAILED, `Step ${step.stepNumber} is a FILL with no value.`);
      }
      lines.push(`await ${locatorFor()}.fill(${quote(step.value)});`);
      break;
    }
    case 'PRESS': {
      const key = step.value ?? 'Enter';
      lines.push(step.target ? `await ${locatorFor()}.press(${quote(key)});` : `await page.keyboard.press(${quote(key)});`);
      break;
    }
    case 'ASSERT_VISIBLE':
      lines.push(`await expect(${locatorFor()}).toBeVisible();`);
      break;
    case 'ASSERT_TEXT': {
      const expected = step.value ?? step.expected;
      if (!expected) throw unsupportedAssertion(step);
      lines.push(`await expect(${locatorFor()}).toContainText(${regexLiteral(expected)});`);
      break;
    }
    case 'ASSERT_URL': {
      const expected = step.value ?? step.expected;
      if (!expected) throw unsupportedAssertion(step);
      lines.push(`await expect(page).toHaveURL(${regexLiteral(expected)});`);
      break;
    }
    case 'ASSERT_TITLE': {
      const expected = step.value ?? step.expected;
      if (!expected) throw unsupportedAssertion(step);
      lines.push(`await expect(page).toHaveTitle(${regexLiteral(expected)});`);
      break;
    }
    default:
      throw unsupportedAssertion(step);
  }
  return lines;
}

/**
 * @param {object} testCase canonical test case
 * @param {{ baseUrl?: string, sourceFile?: string, provider?: string }} [options]
 * @returns {{ fileName: string, code: string }}
 */
export function generateSpec(testCase, options = {}) {
  const parsed = TestCaseSchema.safeParse(testCase);
  if (!parsed.success) {
    throw new PipelineError(ErrorCode.GENERATION_FAILED, 'Canonical test case failed validation before generation.', {
      details: parsed.error.issues,
    });
  }
  const canonical = parsed.data;

  const header = [
    '// ---------------------------------------------------------------------------',
    '// GENERATED FILE - do not edit by hand.',
    '// Produced by playwright-test-generator from a manual test case.',
    `//   test case : ${canonical.id}`,
    options.sourceFile ? `//   source    : ${options.sourceFile}` : null,
    options.provider ? `//   analyzer  : ${options.provider}` : null,
    '// Re-run `npm run generate` after editing the manual test case.',
    '// ---------------------------------------------------------------------------',
    '',
    `import { test, expect } from '@playwright/test';`,
    '',
  ].filter((line) => line !== null);

  const body = [];
  if (canonical.preconditions?.length) {
    body.push(...canonical.preconditions.map((precondition) => `${INDENT}// Precondition: ${precondition}`), '');
  }

  canonical.steps.forEach((step, index) => {
    if (index > 0) body.push('');
    for (const line of emitStep(step, options)) body.push(INDENT + line);
  });

  const code = [
    ...header,
    `test(${quote(`${canonical.id} - ${canonical.title}`)}, async ({ page }) => {`,
    ...body,
    '});',
    '',
  ].join('\n');

  return { fileName: `${canonical.id}.spec.js`, code };
}
