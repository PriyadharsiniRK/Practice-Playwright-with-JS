/**
 * Canonical test case model.
 *
 * This is the contract between the "AI" half of the system (which understands
 * natural language) and the "framework" half (which deterministically emits
 * Playwright code). Nothing downstream of this module ever sees free text it
 * has to interpret.
 */

import { z } from 'zod';

/** Every action the deterministic generator knows how to emit. */
export const ACTIONS = [
  'NAVIGATE',
  'GO_BACK',
  'CLICK',
  'FILL',
  'PRESS',
  'ASSERT_VISIBLE',
  'ASSERT_TEXT',
  'ASSERT_URL',
  'ASSERT_TITLE',
];

export const ActionSchema = z.enum(ACTIONS);

/**
 * A target is described semantically, never as a raw CSS selector chosen by the
 * model. `locator` exists as a last-resort escape hatch for test authors, and
 * the selector strategy treats it as the lowest priority option.
 */
export const TargetSchema = z.object({
  description: z.string().min(1),
  role: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  locator: z.string().min(1).optional(),
});

export const TestStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  originalText: z.string().min(1),
  action: ActionSchema,
  target: TargetSchema.optional(),
  value: z.string().optional(),
  expected: z.string().optional(),
});

export const TestCaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  preconditions: z.array(z.string()).optional(),
  steps: z.array(TestStepSchema).min(1),
});

/**
 * A manual test case straight out of Excel/Word, before any interpretation.
 */
export const RawStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  text: z.string().min(1),
  expected: z.string().optional(),
});

export const RawTestCaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  preconditions: z.array(z.string()).default([]),
  steps: z.array(RawStepSchema).min(1),
  source: z.string().optional(),
});

/**
 * The exact shape the analyzer asks the LLM for. `stepNumber` and
 * `originalText` are echoed back so a malformed response is easy to detect,
 * but the framework always overwrites them with the values it already knows.
 */
const nullableString = z.string().nullable().optional();

const AnalyzedTargetSchema = z.object({
  description: z.string().min(1),
  role: nullableString,
  name: nullableString,
  locator: nullableString,
});

export const AnalyzedStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  originalText: z.string().min(1),
  action: ActionSchema,
  target: AnalyzedTargetSchema.nullable().optional(),
  value: nullableString,
  expected: nullableString,
});

/** Drops the nulls the JSON schema needs but the canonical model forbids. */
export function normalizeAnalyzedStep(analyzed, rawStep) {
  const step = {
    stepNumber: rawStep.stepNumber,
    originalText: rawStep.text,
    action: analyzed.action,
  };
  if (analyzed.target) step.target = stripNulls(analyzed.target);
  if (analyzed.value != null && analyzed.value !== '') step.value = analyzed.value;
  const expected = analyzed.expected ?? rawStep.expected;
  if (expected != null && expected !== '') step.expected = expected;
  return TestStepSchema.parse(step);
}

function stripNulls(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value != null && value !== ''),
  );
}

/** Formats a Zod error into something a human can act on. */
export function describeZodError(error) {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}
