/**
 * The AI engine: asks Claude to write the spec file.
 *
 * Falls back to the offline engine at the CLI level when no credentials are
 * configured, so this module assumes it may talk to the API.
 */
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt.js';

export const DEFAULT_MODEL = 'claude-opus-5';

/**
 * Server-side refusal fallback: if a policy classifier declines the request,
 * the API re-runs it on a fallback model inside the same call. Not every
 * account or SDK version has the beta, so `generate` retries without it once.
 */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/** True when the SDK will find a credential without us passing one. */
export function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * @param {object} spec parsed spec
 * @param {object} options {model, onToken}
 * @returns {Promise<{code: string, model: string, usage: object, notes: string[]}>}
 */
export async function generate(spec, { model = DEFAULT_MODEL, onToken } = {}) {
  const client = new Anthropic();
  const notes = [];

  const request = {
    model,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(spec) }],
  };

  let message;
  try {
    message = await runStream(client, { ...request, betas: [FALLBACK_BETA], fallbacks: 'default' }, onToken);
  } catch (error) {
    if (!isUnsupportedBetaError(error)) throw describe(error);
    // The account or SDK build does not have the fallback beta; proceed plainly.
    notes.push('Refusal fallbacks are unavailable on this account; sent the request without them.');
    message = await runStream(client, request, onToken).catch((e) => {
      throw describe(e);
    });
  }

  if (message.stop_reason === 'refusal') {
    const detail = message.stop_details?.explanation || message.stop_details?.category || 'no detail given';
    throw new Error(`Claude declined to generate this test (${detail}). Rephrase the spec or use --offline.`);
  }

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const code = extractCode(text);
  if (!code) {
    throw new Error('The model returned no code block. Re-run, or use --offline.');
  }

  return { code, model: message.model || model, usage: message.usage, notes };
}

async function runStream(client, params, onToken) {
  const stream = client.beta.messages.stream(params);
  if (onToken) stream.on('text', onToken);
  return stream.finalMessage();
}

/** A 400 naming the beta flag or the fallbacks parameter is recoverable. */
function isUnsupportedBetaError(error) {
  if (!(error instanceof Anthropic.BadRequestError)) return false;
  const message = String(error.message || '');
  return message.includes('fallback') || message.includes('beta');
}

/** Turns SDK errors into messages a CLI user can act on. */
function describe(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return new Error('Authentication failed. Check ANTHROPIC_API_KEY, or run with --offline.');
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new Error('Rate limited by the API. Wait and retry, or run with --offline.');
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new Error(`Could not reach the API (${error.message}). Try again, or run with --offline.`);
  }
  if (error instanceof Anthropic.APIError) {
    return new Error(`API error ${error.status ?? ''}: ${error.message}`.trim());
  }
  return error;
}

/** Pulls the file out of a fenced code block, tolerating a bare response. */
export function extractCode(text) {
  const fenced = String(text).match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
  const code = fenced ? fenced[1] : text;
  return code.trim() ? `${code.trim()}\n` : '';
}
