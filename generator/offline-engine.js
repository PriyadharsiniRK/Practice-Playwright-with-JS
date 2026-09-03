/**
 * The offline engine: a deterministic phrase -> Playwright translator.
 *
 * It handles the vocabulary documented in README.md and needs no API key, so
 * the generator stays usable (and testable) without network access. Anything
 * it does not recognise becomes a TODO comment plus a warning rather than a
 * silently dropped step.
 */

const ROLES = [
  'button',
  'link',
  'heading',
  'checkbox',
  'radio',
  'tab',
  'menuitem',
  'textbox',
  'combobox',
  'option',
  'listitem',
  'alert',
];

/** Quotes a value as a single-quoted JS string literal. */
export function js(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

/** Quotes a value as a regex literal that matches it verbatim. */
export function rx(value) {
  return `/${String(value).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}/`;
}

/**
 * Resolves a target description to a Playwright locator expression.
 *
 * Targets may carry an explicit strategy prefix (`css:`, `testid:`, `text:`,
 * `label:`, `placeholder:`) or a role noun ("the Save button"), and otherwise
 * fall back to `fallbackRole`.
 */
export function locator(target, fallbackRole = 'button') {
  let name = String(target).trim().replace(/^the\s+/i, '');

  const prefix = name.match(/^(css|selector|testid|test-id|text|label|placeholder|title|alt):\s*(.+)$/i);
  if (prefix) {
    const kind = prefix[1].toLowerCase();
    const value = prefix[2].trim();
    if (kind === 'css' || kind === 'selector') return `page.locator(${js(value)})`;
    if (kind === 'testid' || kind === 'test-id') return `page.getByTestId(${js(value)})`;
    if (kind === 'text') return `page.getByText(${js(value)})`;
    if (kind === 'label') return `page.getByLabel(${js(value)})`;
    if (kind === 'placeholder') return `page.getByPlaceholder(${js(value)})`;
    if (kind === 'title') return `page.getByTitle(${js(value)})`;
    if (kind === 'alt') return `page.getByAltText(${js(value)})`;
  }

  // Bare CSS selectors are common in hand-written specs; honour them as-is.
  if (/^[#.[]/.test(name) || /^(input|button|a|div|span)[.#[]/.test(name)) {
    return `page.locator(${js(name)})`;
  }

  let role = fallbackRole;
  // A role noun inside the quotes ("Save button") works too.
  const trailingRole = name.match(new RegExp(`^(.*\\S)\\s+(${ROLES.join('|')})$`, 'i'));
  if (trailingRole) {
    name = trailingRole[1].trim();
    role = trailingRole[2].toLowerCase();
  }

  if (role === 'text') return `page.getByText(${js(name)})`;
  if (role === 'label') return `page.getByLabel(${js(name)})`;
  if (role === 'placeholder') return `page.getByPlaceholder(${js(name)})`;
  return `page.getByRole(${js(role)}, { name: ${js(name)} })`;
}

// A quoted or bare argument (3 capture groups). Quoted wins so values may
// contain spaces.
const ARG = `(?:"([^"]*)"|'([^']*)'|(\\S+))`;
// An element target: an argument plus an optional role noun (4 capture groups).
const TARGET = `(?:the\\s+)?${ARG}(?:\\s+(${ROLES.join('|')}))?`;

/** Reads an ARG that starts at capture group `i`. */
const arg = (m, i) => m[i] ?? m[i + 1] ?? m[i + 2];
/** Reads a TARGET that starts at capture group `i` into a locator. */
const target = (m, i, fallbackRole) => locator(arg(m, i), m[i + 3] || fallbackRole);

const RULES = [
  // --- Assertions -------------------------------------------------------
  {
    name: 'expect-url',
    pattern: new RegExp(`^(?:expect|verify|assert|check)\\s+(?:the\\s+)?url\\s+(?:to\\s+)?(contains?|is|equals?|to be)\\s+${ARG}$`, 'i'),
    build: (m) => {
      const value = arg(m, 2);
      const exact = /^(is|equals?|to be)$/i.test(m[1]);
      return `await expect(page).toHaveURL(${exact ? js(value) : rx(value)});`;
    },
  },
  {
    name: 'expect-title',
    pattern: new RegExp(`^(?:expect|verify|assert|check)\\s+(?:the\\s+)?(?:page\\s+)?title\\s+(?:to\\s+)?(contains?|is|equals?|to be)\\s+${ARG}$`, 'i'),
    build: (m) => {
      const value = arg(m, 2);
      const exact = /^(is|equals?|to be)$/i.test(m[1]);
      return `await expect(page).toHaveTitle(${exact ? js(value) : rx(value)});`;
    },
  },
  {
    name: 'expect-value',
    pattern: new RegExp(`^(?:expect|verify|assert|check)\\s+${TARGET}\\s+to\\s+have\\s+value\\s+${ARG}$`, 'i'),
    build: (m) => `await expect(${target(m, 1, 'label')}).toHaveValue(${js(arg(m, 5))});`,
  },
  {
    name: 'expect-count',
    pattern: new RegExp(`^(?:expect|verify|assert|check)\\s+${TARGET}\\s+to\\s+have\\s+count\\s+(\\d+)$`, 'i'),
    build: (m) => `await expect(${target(m, 1, 'listitem')}).toHaveCount(${m[5]});`,
  },
  {
    name: 'expect-visibility',
    pattern: new RegExp(`^(?:expect|verify|assert|check|see)\\s+${TARGET}\\s+(?:to\\s+)?(?:(not)\\s+)?(?:to\\s+)?(?:be\\s+)?(visible|hidden|present|shown|displayed|gone)$`, 'i'),
    build: (m) => {
      const state = m[6].toLowerCase();
      const negated = Boolean(m[5]) || state === 'hidden' || state === 'gone';
      return `await expect(${target(m, 1, 'text')})${negated ? '.not.toBeVisible()' : '.toBeVisible()'};`;
    },
  },
  {
    name: 'expect-state',
    pattern: new RegExp(`^(?:expect|verify|assert|check)\\s+${TARGET}\\s+(?:to\\s+)?(?:(not)\\s+)?(?:to\\s+)?(?:be\\s+)?(enabled|disabled|checked|editable|empty|focused)$`, 'i'),
    build: (m) => {
      const matchers = {
        enabled: 'toBeEnabled',
        disabled: 'toBeDisabled',
        checked: 'toBeChecked',
        editable: 'toBeEditable',
        empty: 'toBeEmpty',
        focused: 'toBeFocused',
      };
      const matcher = matchers[m[6].toLowerCase()];
      return `await expect(${target(m, 1)})${m[5] ? '.not.' : '.'}${matcher}();`;
    },
  },
  {
    name: 'expect-text',
    pattern: new RegExp(`^(?:expect|verify|assert|check)\\s+(?:to\\s+)?(?:see\\s+)?(?:the\\s+)?text\\s+${ARG}$`, 'i'),
    build: (m) => `await expect(page.getByText(${js(arg(m, 1))})).toBeVisible();`,
  },
  {
    name: 'expect-contains-text',
    pattern: new RegExp(`^(?:expect|verify|assert|check)\\s+${TARGET}\\s+to\\s+contain\\s+(?:the\\s+)?(?:text\\s+)?${ARG}$`, 'i'),
    build: (m) => `await expect(${target(m, 1, 'text')}).toContainText(${js(arg(m, 5))});`,
  },

  // --- Navigation -------------------------------------------------------
  {
    name: 'goto',
    pattern: new RegExp(`^(?:go to|navigate to|open|visit|browse to)\\s+${ARG}$`, 'i'),
    build: (m) => `await page.goto(${js(arg(m, 1))});`,
  },
  { name: 'back', pattern: /^(?:go\s+)?back$/i, build: () => 'await page.goBack();' },
  { name: 'forward', pattern: /^(?:go\s+)?forward$/i, build: () => 'await page.goForward();' },
  { name: 'reload', pattern: /^(?:reload|refresh)(?:\s+the\s+page)?$/i, build: () => 'await page.reload();' },

  // --- Interactions -----------------------------------------------------
  {
    name: 'fill',
    pattern: new RegExp(`^(?:fill|enter|set)\\s+(?:in\\s+)?${TARGET}\\s+(?:with|to|as)\\s+${ARG}$`, 'i'),
    build: (m) => `await ${target(m, 1, 'label')}.fill(${js(arg(m, 5))});`,
  },
  {
    name: 'type-into',
    pattern: new RegExp(`^(?:type|enter|input)\\s+${ARG}\\s+(?:in|into|in to)\\s+${TARGET}$`, 'i'),
    build: (m) => `await ${target(m, 4, 'label')}.fill(${js(arg(m, 1))});`,
  },
  {
    name: 'select',
    pattern: new RegExp(`^(?:select|choose)\\s+${ARG}\\s+(?:from|in)\\s+${TARGET}$`, 'i'),
    build: (m) => `await ${target(m, 4, 'label')}.selectOption(${js(arg(m, 1))});`,
  },
  {
    name: 'check',
    pattern: new RegExp(`^(check|uncheck|tick|untick)\\s+${TARGET}$`, 'i'),
    build: (m) => `await ${target(m, 2, 'checkbox')}.${/^un/i.test(m[1]) ? 'uncheck' : 'check'}();`,
  },
  {
    name: 'press-key',
    pattern: new RegExp(`^press\\s+(?:the\\s+)?${ARG}(?:\\s+key)$`, 'i'),
    build: (m) => `await page.keyboard.press(${js(arg(m, 1))});`,
  },
  {
    name: 'double-click',
    pattern: new RegExp(`^double[- ]click\\s+(?:on\\s+)?${TARGET}$`, 'i'),
    build: (m) => `await ${target(m, 1)}.dblclick();`,
  },
  {
    name: 'click',
    pattern: new RegExp(`^(?:click|tap|press)\\s+(?:on\\s+)?${TARGET}$`, 'i'),
    build: (m) => `await ${target(m, 1)}.click();`,
  },
  {
    name: 'hover',
    pattern: new RegExp(`^hover\\s+(?:over\\s+|on\\s+)?${TARGET}$`, 'i'),
    build: (m) => `await ${target(m, 1)}.hover();`,
  },
  {
    name: 'upload',
    pattern: new RegExp(`^upload\\s+${ARG}\\s+(?:to|into|in)\\s+${TARGET}$`, 'i'),
    build: (m) => `await ${target(m, 4, 'label')}.setInputFiles(${js(arg(m, 1))});`,
  },
  {
    name: 'screenshot',
    pattern: new RegExp(`^(?:take a\\s+)?screenshot(?:\\s+(?:as|to|named)\\s+${ARG})?$`, 'i'),
    build: (m) => `await page.screenshot({ path: ${js(arg(m, 1) || 'screenshot.png')} });`,
  },
];

/**
 * Compiles one plain-English step.
 * @returns {{code: string[], warning?: string, rule?: string}}
 */
export function compileStep(step) {
  const text = String(step).trim().replace(/\s+/g, ' ').replace(/[.;]+$/, '');
  if (!text) return { code: [] };

  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (match) return { code: [rule.build(match)], rule: rule.name };
  }

  // Hard waits are a real anti-pattern, so name them rather than emitting one.
  if (/^wait\b/i.test(text)) {
    return {
      code: [`// TODO: replace this wait with a web-first assertion: ${text}`],
      warning: `Step "${text}" asks for a wait. Prefer "expect <target> to be visible" over a fixed timeout.`,
      rule: 'unsupported-wait',
    };
  }

  return {
    code: [`// TODO: unsupported step: ${text}`],
    warning: `Step "${text}" did not match any known pattern; a TODO was emitted instead.`,
    rule: 'unsupported',
  };
}

/** Compiles a whole parsed spec into statements plus warnings. */
export function compileSteps(steps) {
  const statements = [];
  const warnings = [];
  for (const step of steps) {
    const { code, warning } = compileStep(step);
    statements.push(...code);
    if (warning) warnings.push(warning);
  }
  return { statements, warnings };
}

export const supportedRules = RULES.map((r) => r.name);
