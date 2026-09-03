/**
 * Anthropic-backed step interpreter.
 *
 * Uses structured outputs so the model is constrained to the canonical step
 * schema at decode time. The response is still validated with Zod on our side
 * (belt and braces), and a single controlled repair attempt is made when the
 * first answer does not satisfy the schema.
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { ErrorCode, PipelineError } from '../errors.js';
import { ACTIONS } from '../model/testCaseSchema.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';

export const DEFAULT_MODEL = 'claude-opus-5';

/**
 * The wire schema handed to the model. It is intentionally flatter and more
 * permissive than the canonical model (nullable fields instead of optional
 * ones) because strict JSON schemas cannot express "sometimes absent".
 */
const LlmStepSchema = z.object({
  stepNumber: z.number().int(),
  originalText: z.string(),
  action: z.enum(ACTIONS),
  target: z
    .object({
      description: z.string(),
      role: z.string().nullable(),
      name: z.string().nullable(),
    })
    .nullable(),
  value: z.string().nullable(),
  expected: z.string().nullable(),
});

export function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export function createLlmProvider(options = {}) {
  const model = options.model ?? process.env.ANALYZER_MODEL ?? DEFAULT_MODEL;
  const client = new Anthropic();

  async function ask(testCase, rawStep, repairNote) {
    const response = await client.messages.parse({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(testCase, rawStep, repairNote) }],
      output_config: {
        format: zodOutputFormat(LlmStepSchema),
        effort: 'low',
      },
    });
    if (response.stop_reason === 'refusal') {
      throw new PipelineError(
        ErrorCode.INVALID_LLM_RESPONSE,
        `The model declined to interpret step ${rawStep.stepNumber}.`,
        { details: response.stop_details },
      );
    }
    if (!response.parsed_output) {
      throw new PipelineError(
        ErrorCode.INVALID_LLM_RESPONSE,
        `The model returned no parseable JSON for step ${rawStep.stepNumber}.`,
      );
    }
    return response.parsed_output;
  }

  return {
    name: `anthropic:${model}`,
    /**
     * @returns {Promise<object>} an object shaped like AnalyzedStepSchema
     */
    async interpret(testCase, rawStep) {
      try {
        return await ask(testCase, rawStep);
      } catch (error) {
        if (error instanceof PipelineError) {
          // Controlled repair: hand the failure back to the model once.
          return ask(testCase, rawStep, error.message);
        }
        throw new PipelineError(
          ErrorCode.INVALID_LLM_RESPONSE,
          `Analyzer request failed for step ${rawStep.stepNumber}: ${error.message}`,
          { hint: 'Check ANTHROPIC_API_KEY and network access, or run with --provider heuristic.' },
        );
      }
    },
  };
}
