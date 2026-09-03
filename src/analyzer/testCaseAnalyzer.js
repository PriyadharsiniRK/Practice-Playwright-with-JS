/**
 * Test case analyzer - the "understanding" stage.
 *
 * Raw manual steps in, canonical TestCase out. Whichever provider does the
 * interpreting, the result passes through the same Zod validation, so a bad
 * answer can never reach the code generator.
 */

import { ErrorCode, PipelineError } from '../errors.js';
import {
  AnalyzedStepSchema,
  TestCaseSchema,
  describeZodError,
  normalizeAnalyzedStep,
} from '../model/testCaseSchema.js';
import { createHeuristicProvider } from './heuristicProvider.js';
import { createLlmProvider, isConfigured } from './llmProvider.js';

/**
 * @param {'auto'|'llm'|'heuristic'} mode
 */
export function createProvider(mode = 'auto', options = {}) {
  if (mode === 'heuristic') return createHeuristicProvider();
  if (mode === 'llm') {
    if (!isConfigured()) {
      throw new PipelineError(ErrorCode.INVALID_LLM_RESPONSE, 'No Anthropic credentials found.', {
        hint: 'Set ANTHROPIC_API_KEY (see .env.example) or run with --provider heuristic.',
      });
    }
    return createLlmProvider(options);
  }
  return isConfigured() ? createLlmProvider(options) : createHeuristicProvider();
}

/** Validates one provider answer, repairing the obvious mistakes first. */
function validateStep(answer, rawStep) {
  const candidate = {
    ...answer,
    // The provider echoes these back; the framework owns the real values.
    stepNumber: rawStep.stepNumber,
    originalText: rawStep.text,
  };

  const parsed = AnalyzedStepSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new PipelineError(
      ErrorCode.INVALID_LLM_RESPONSE,
      `Analyzer output for step ${rawStep.stepNumber} does not match the schema:\n${describeZodError(parsed.error)}`,
      { details: candidate },
    );
  }
  return normalizeAnalyzedStep(parsed.data, rawStep);
}

/**
 * @param {object} rawTestCase parsed manual test case
 * @param {{ provider?: object, onStep?: (step: object) => void }} [options]
 * @returns {Promise<object>} canonical test case
 */
export async function analyzeTestCase(rawTestCase, options = {}) {
  const provider = options.provider ?? createProvider('auto');
  const steps = [];

  for (const rawStep of rawTestCase.steps) {
    const answer = await provider.interpret(rawTestCase, rawStep);
    const step = validateStep(answer, rawStep);
    steps.push(step);
    options.onStep?.(step);
  }

  const canonical = {
    id: rawTestCase.id,
    title: rawTestCase.title,
    ...(rawTestCase.preconditions?.length ? { preconditions: rawTestCase.preconditions } : {}),
    steps,
  };

  const parsed = TestCaseSchema.safeParse(canonical);
  if (!parsed.success) {
    throw new PipelineError(
      ErrorCode.INVALID_TEST_CASE,
      `Canonical model for ${rawTestCase.id} is invalid:\n${describeZodError(parsed.error)}`,
    );
  }
  return parsed.data;
}
