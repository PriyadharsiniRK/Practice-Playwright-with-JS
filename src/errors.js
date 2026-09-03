/**
 * Typed errors for the generator pipeline.
 *
 * Every failure surfaces a stable machine-readable `code` plus a human readable
 * message. The CLI prints the code so a failure is always explainable, and the
 * pipeline never silently degrades into incorrect automation.
 */

export const ErrorCode = {
  UNSUPPORTED_ACTION: 'UNSUPPORTED_ACTION',
  TARGET_NOT_UNDERSTOOD: 'TARGET_NOT_UNDERSTOOD',
  AMBIGUOUS_TARGET: 'AMBIGUOUS_TARGET',
  INVALID_TEST_CASE: 'INVALID_TEST_CASE',
  INVALID_LLM_RESPONSE: 'INVALID_LLM_RESPONSE',
  GENERATION_FAILED: 'GENERATION_FAILED',
  TEST_EXECUTION_FAILED: 'TEST_EXECUTION_FAILED',
};

export class PipelineError extends Error {
  /**
   * @param {string} code one of {@link ErrorCode}
   * @param {string} message human readable explanation
   * @param {{ hint?: string, details?: unknown }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
    this.hint = options.hint;
    this.details = options.details;
  }

  /** Multi-line rendering used by the CLI. */
  format() {
    const lines = [`${this.code}: ${this.message}`];
    if (this.hint) {
      lines.push('', this.hint);
    }
    return lines.join('\n');
  }
}

export const fail = (code, message, options) => {
  throw new PipelineError(code, message, options);
};

/** The assertion vocabulary the framework can currently automate. */
export const SUPPORTED_ASSERTIONS = ['visible', 'text', 'URL', 'title'];

export const unsupportedAssertion = (step) =>
  new PipelineError(
    ErrorCode.UNSUPPORTED_ACTION,
    `Unsupported assertion.`,
    {
      hint: [
        `Step ${step.stepNumber}:`,
        `"${step.originalText}"`,
        '',
        'The framework currently supports:',
        ...SUPPORTED_ASSERTIONS.map((a) => `- ${a}`),
      ].join('\n'),
      details: { stepNumber: step.stepNumber, originalText: step.originalText },
    },
  );
