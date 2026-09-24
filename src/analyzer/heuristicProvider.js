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
import { DEFAULT_APPLICATION } from '../generator/applications/index.js';

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
// "open" is here as well as in NAVIGATE: a step that says "open" without an
// address is opening something on the page, and reaches this rule instead.
const CLICK = /^(click|tap|select|press\s+the\s+\w+\s+button|choose|open)\b/i;
const PRESS = /\bpress\b\s+(?:the\s+)?["']?(enter|return|escape|tab|arrow\w+|space)["']?/i;
const ASSERT = /^(verify|check|assert|validate|ensure|confirm|the\s+\w+\s+should)\b/i;
const BACK = /\b(navigate|go)\s+back\b|\bpress\s+back\b|\bbrowser\s+back\b/i;
/** "is not displayed" / "is no longer visible" - the negative of ASSERT_VISIBLE. */
const NEGATED = /\b(is|are|should\s+be)\s+(not|no\s+longer)\s+(displayed|visible|shown|present)\b/i;

/**
 * "title" is ambiguous: the browser tab title, or the title *of an element on
 * the page*. Only a page/browser/tab qualifier - or no qualifier at all - means
 * the document title; "video title" names an element and is asserted as text.
 */
const PAGE_TITLE = /\b(page|browser|tab|window)\s+title\b|\btitle\s+of\s+the\s+(page|tab|browser|window)\b/i;
const TITLE_QUALIFIER = /\b([a-z][a-z-]*)\s+title\b/i;

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
  { pattern: /\b(combo\s*box|dropdown|select)\b/i, role: 'combobox' },
  { pattern: /\b(box|bar|input|fields?)\b/i, role: 'textbox' },
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
function interpretAssertion(text, application) {
  const quoted = quotedValue(text);

  if (/\btitle\b/i.test(text)) {
    const qualifier = text.match(TITLE_QUALIFIER)?.[1]?.toLowerCase();
    // An unqualified "the title" means the document title; "video title" does not.
    const isDocumentTitle = PAGE_TITLE.test(text) || !qualifier || qualifier === 'the';
    if (isDocumentTitle) {
      const expected = quoted ?? text.match(/contains?\s+(.+?)\s*$/i)?.[1]?.replace(/[.\s]+$/, '');
      if (!expected) return null;
      return { action: 'ASSERT_TITLE', target: null, value: expected };
    }
    // Otherwise it names an element - fall through to the text/visibility checks.
  }

  if (/\burl\b|\baddress\s+bar\b/i.test(text)) {
    const expected = quoted ?? text.match(/(\/[a-z0-9_\-/]+)/i)?.[1];
    if (!expected) return null;
    return { action: 'ASSERT_URL', target: null, value: expected };
  }

  // Domain shorthands supplied by the application under test, e.g. on YouTube
  // "the video page is displayed" means the URL contains /watch.
  for (const hint of application.assertionHints ?? []) {
    if (hint.match.test(text)) {
      return { action: hint.action, target: hint.target ? target(hint.target) : null, value: hint.value };
    }
  }

  if (NEGATED.test(text)) {
    return { action: 'ASSERT_HIDDEN', target: target(text.replace(NEGATED, ' ')), value: null };
  }

  if (quoted && /\b(contains?|shows?|displays?|reads?)\b/i.test(text)) {
    return { action: 'ASSERT_TEXT', target: target(text), value: quoted };
  }

  if (/\b(displayed|visible|shown|present|appears?|exists?)\b/i.test(text)) {
    return { action: 'ASSERT_VISIBLE', target: target(text), value: null };
  }

  return null;
}

/**
 * Resolves an application's own wording for a value that is not in quotes.
 * `value` on the rule supplies test data the manual test case never states;
 * otherwise the value is whatever the rule captured as the `value` group.
 */
function matchDataEntry(text, application) {
  for (const rule of application.dataEntry ?? []) {
    const found = text.match(rule.match);
    if (!found) continue;
    const value = rule.value ?? found.groups?.value;
    if (value) return { target: rule.target, value };
  }
  return null;
}

/** The application's own base URL, when a step names the site but no address. */
function siteUrl(text, application) {
  const named = application.nameHints?.some((pattern) => pattern.test(text));
  if (named && application.baseUrl) return application.baseUrl;
  return /youtube/i.test(text) ? 'https://www.youtube.com' : null;
}

export function createHeuristicProvider() {
  return {
    name: 'heuristic',
    async interpret(testCase, rawStep, context = {}) {
      const application = context.application ?? DEFAULT_APPLICATION;
      const text = rawStep.text.trim();
      const base = { stepNumber: rawStep.stepNumber, originalText: text, expected: rawStep.expected ?? null };

      // Wording the application declares as meaning something its verb does not
      // say, e.g. "Add Sauce Labs Backpack to cart" is a click.
      for (const hint of application.stepHints ?? []) {
        if (hint.match.test(text)) {
          return {
            ...base,
            action: hint.action,
            target: hint.target ? target(hint.target) : null,
            value: hint.value ?? null,
          };
        }
      }

      if (NAVIGATE.test(text)) {
        const url = text.match(URL_PATTERN)?.[0] ?? siteUrl(text, application);
        // "Open the shopping cart" opens an element, not an address. Only treat
        // this as navigation when there is somewhere to navigate *to*; anything
        // else falls through to the click rule below.
        if (url) return { ...base, action: 'NAVIGATE', target: null, value: url };
      }

      if (BACK.test(text)) {
        return { ...base, action: 'GO_BACK', target: null, value: null };
      }

      if (ASSERT.test(text)) {
        // "Verify Products heading" says what to look at but not what counts as
        // success; the ExpectedResult column is where the tester wrote that
        // ("Products heading is displayed"), so it is read as part of the step.
        const assertion =
          interpretAssertion(text, application) ??
          (rawStep.expected ? interpretAssertion(`${text}. ${rawStep.expected}`, application) : null);
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
        const remainder = text.replace(FILL, '').trim();
        const value = quotedValue(text);
        if (value) {
          return { ...base, action: 'FILL', target: target(remainder || 'search box'), value };
        }

        // No quotes. The application may still recognise the wording - some
        // manual test cases write `Enter username standard_user`, and some name
        // a field whose value is only implied (`Enter first name`).
        const entry = matchDataEntry(remainder, application);
        if (entry) return { ...base, action: 'FILL', target: target(entry.target), value: entry.value };

        throw new PipelineError(
          ErrorCode.TARGET_NOT_UNDERSTOOD,
          `Step ${rawStep.stepNumber} looks like data entry but no quoted value was found: "${text}"`,
          { hint: 'Write the value in quotes, e.g. Enter "Playwright automation" in the search box.' },
        );
      }

      const pressMatch = text.match(PRESS);
      if (pressMatch && !CLICK.test(text)) {
        const key = pressMatch[1];
        return { ...base, action: 'PRESS', target: null, value: key[0].toUpperCase() + key.slice(1) };
      }

      if (CLICK.test(text)) {
        const remainder = text.replace(/^(click|tap|select|choose|open)\s*(on)?\s*/i, '').trim();
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
