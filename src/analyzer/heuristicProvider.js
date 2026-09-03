/**
 * Offline rule-based step interpreter.
 *
 * Produces exactly the same structure as the LLM provider, so every downstream
 * stage is identical. It exists for two reasons:
 *
 *   1. The demo (and CI) must run with no API key and no model spend.
 *   2. It is a useful baseline - anything it cannot classify is a step whose
 *      wording genuinely needs language understanding.
 *
 * It is *not* a fallback that silently rescues a failed LLM call: the provider
 * in use is chosen explicitly and reported in the CLI output and in the header
 * of every generated spec file.
 */

import { ErrorCode, PipelineError } from '../errors.js';

const URL_PATTERN = /\bhttps?:\/\/[^\s"'<>]+/i;
/**
 * Matches a quoted value, keeping the quote characters balanced so an
 * apostrophe inside a double-quoted value does not truncate it.
 */
const QUOTED_PATTERN = /"([^"]+)"|“([^”]+)”|'([^']+)'|‘([^’]+)’/;

/** Returns the text inside the first balanced pair of quotes, if any. */
const quotedValue = (text) => text.match(QUOTED_PATTERN)?.slice(1).find((group) => group != null);

const NAVIGATE = /^(open|go\s+to|navigate\s+to|launch|browse\s+to|visit)\b/i;
const FILL = /^(enter|type|input|fill|search\s+for)\b/i;
const CLICK = /^(click|tap|select|press\s+the\s+\w+\s+button|choose)\b/i;
const PRESS = /\bpress\b\s+(?:the\s+)?["']?(enter|return|escape|tab|arrow\w+|space)["']?/i;
const ASSERT = /^(verify|check|assert|validate|ensure|confirm|the\s+\w+\s+should)\b/i;
const BACK = /\b(navigate|go)\s+back\b|\bpress\s+back\b|\bbrowser\s+back\b/i;

/** Strips leading prepositions/articles so "in the search box" -> "search box". */
function cleanTarget(text) {
  return text
    .replace(QUOTED_PATTERN, ' ')
    .replace(/^\s*(that|the|a|an)\s+/i, '')
    .replace(/\b(in|into|on|at|to|from|of|inside|within)\s+the\b/gi, ' ')
    .replace(/\b(is|are|was|were)\s+(displayed|visible|shown|present|there)\b/gi, ' ')
    .replace(/\bfield\b/gi, ' box')
    .replace(/[.,;:]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nouns that name an ARIA role rather than the element itself. */
const ROLE_NOUNS = [
  { pattern: /\bbuttons?\b/i, role: 'button' },
  { pattern: /\b(box|bar|input|fields?)\b/i, role: 'combobox' },
  { pattern: /\b(links?|logos?)\b/i, role: 'link' },
  { pattern: /\b(headings?|titles?)\b/i, role: 'heading' },
];

/**
 * Splits "subscribe button" into role "button" and accessible name "subscribe",
 * which is what lets the selector strategy fall back to getByRole() for
 * elements that are not in the application catalog.
 */
const target = (description) => {
  const cleaned = cleanTarget(description) || description.trim();
  const match = ROLE_NOUNS.find((candidate) => candidate.pattern.test(cleaned));
  if (!match) return { description: cleaned, role: null, name: null };

  const name = cleaned.replace(match.pattern, ' ').replace(/\s+/g, ' ').trim();
  return { description: cleaned, role: match.role, name: name || null };
};

/** Classifies an assertion step into one of the four supported assertions. */
function interpretAssertion(text) {
  const quoted = quotedValue(text);

  if (/\btitle\b/i.test(text)) {
    const expected = quoted ?? text.match(/contains?\s+(.+?)\s*$/i)?.[1]?.replace(/[.\s]+$/, '');
    if (!expected) return null;
    return { action: 'ASSERT_TITLE', target: null, value: expected };
  }

  if (/\burl\b|\baddress\s+bar\b/i.test(text)) {
    const expected = quoted ?? text.match(/(\/[a-z0-9_\-/]+)/i)?.[1];
    if (!expected) return null;
    return { action: 'ASSERT_URL', target: null, value: expected };
  }

  // Domain shorthand: "the video page is displayed" is a URL assertion.
  if (/\b(video|watch)\s+page\b/i.test(text)) {
    return { action: 'ASSERT_URL', target: null, value: '/watch' };
  }
  if (/\b(home\s*page|homepage)\b/i.test(text) && /youtube/i.test(text)) {
    return { action: 'ASSERT_TITLE', target: null, value: 'YouTube' };
  }

  if (quoted && /\b(contains?|shows?|displays?|reads?)\b/i.test(text)) {
    return { action: 'ASSERT_TEXT', target: target(text), value: quoted };
  }

  if (/\b(displayed|visible|shown|present|appears?|exists?)\b/i.test(text)) {
    return { action: 'ASSERT_VISIBLE', target: target(text), value: null };
  }

  return null;
}

export function createHeuristicProvider() {
  return {
    name: 'heuristic',
    async interpret(testCase, rawStep) {
      const text = rawStep.text.trim();
      const base = { stepNumber: rawStep.stepNumber, originalText: text, expected: rawStep.expected ?? null };

      if (NAVIGATE.test(text)) {
        const url = text.match(URL_PATTERN)?.[0] ?? (/youtube/i.test(text) ? 'https://www.youtube.com' : null);
        if (!url) {
          throw new PipelineError(
            ErrorCode.TARGET_NOT_UNDERSTOOD,
            `Step ${rawStep.stepNumber} looks like a navigation but contains no URL: "${text}"`,
          );
        }
        return { ...base, action: 'NAVIGATE', target: null, value: url };
      }

      if (BACK.test(text)) {
        return { ...base, action: 'GO_BACK', target: null, value: null };
      }

      if (ASSERT.test(text)) {
        const assertion = interpretAssertion(text);
        if (!assertion) {
          throw new PipelineError(ErrorCode.UNSUPPORTED_ACTION, 'Unsupported assertion.', {
            hint: [
              `Step ${rawStep.stepNumber}:`,
              `"${text}"`,
              '',
              'The framework currently supports:',
              '- visible',
              '- text',
              '- URL',
              '- title',
            ].join('\n'),
          });
        }
        return { ...base, ...assertion };
      }

      if (FILL.test(text)) {
        const value = quotedValue(text);
        if (!value) {
          throw new PipelineError(
            ErrorCode.TARGET_NOT_UNDERSTOOD,
            `Step ${rawStep.stepNumber} looks like data entry but no quoted value was found: "${text}"`,
            { hint: 'Write the value in quotes, e.g. Enter "Playwright automation" in the search box.' },
          );
        }
        const remainder = text.replace(FILL, '').trim();
        return { ...base, action: 'FILL', target: target(remainder || 'search box'), value };
      }

      const pressMatch = text.match(PRESS);
      if (pressMatch && !CLICK.test(text)) {
        const key = pressMatch[1];
        return { ...base, action: 'PRESS', target: null, value: key[0].toUpperCase() + key.slice(1) };
      }

      if (CLICK.test(text)) {
        const remainder = text.replace(/^(click|tap|select|choose)\s*(on)?\s*/i, '').trim();
        return { ...base, action: 'CLICK', target: target(remainder), value: null };
      }

      throw new PipelineError(
        ErrorCode.UNSUPPORTED_ACTION,
        `Step ${rawStep.stepNumber} could not be classified: "${text}"`,
        {
          hint: 'The offline heuristic analyzer understands open/enter/click/press/verify steps. Set ANTHROPIC_API_KEY and run with --provider llm for free-form wording.',
        },
      );
    },
  };
}
