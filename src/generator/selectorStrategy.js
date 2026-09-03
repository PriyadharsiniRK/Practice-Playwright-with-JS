/**
 * Selector strategy.
 *
 * The LLM describes *what* a step points at ("the YouTube search box"); this
 * module decides *how* to locate it. Selector priority, highest first:
 *
 *   1. getByRole()
 *   2. getByLabel()
 *   3. getByPlaceholder()
 *   4. getByText()
 *   5. locator()   - CSS, only when nothing better exists
 *
 * A small application catalog pins the well-known targets of the app under
 * test to a curated locator. Anything not in the catalog falls back to the
 * role/name the analyzer inferred; if even that is missing the pipeline fails
 * loudly rather than guessing a selector.
 */

import { ErrorCode, PipelineError } from '../errors.js';

/** Ordering used to rank candidate strategies. Lower index wins. */
export const STRATEGY_PRIORITY = ['role', 'label', 'placeholder', 'text', 'css'];

/**
 * Curated targets for the application under test (YouTube).
 *
 * Adding a new *test case* never requires touching this file as long as it
 * reuses these targets; adding a brand new UI element is a one-line data entry.
 */
export const TARGET_CATALOG = [
  {
    id: 'youtube.searchBox',
    description: 'YouTube search box',
    match: [/search\s*(box|bar|input|field|text\s*box)/i, /\bsearch\b.*\b(input|field)\b/i],
    roleHints: ['combobox', 'textbox', 'searchbox'],
    spec: { kind: 'role', role: 'combobox', name: { source: 'search', flags: 'i' } },
  },
  {
    id: 'youtube.searchButton',
    description: 'YouTube search button',
    match: [/search\s*(button|icon)/i, /\bbutton\b.*\bsearch\b/i, /^search$/i],
    roleHints: ['button'],
    spec: { kind: 'role', role: 'button', name: { source: '^search$', flags: 'i' } },
  },
  {
    id: 'youtube.searchResults',
    description: 'YouTube search results list',
    match: [/search\s*results?/i, /results?\s*(list|page|section)/i],
    spec: { kind: 'css', selector: 'ytd-search' },
  },
  {
    id: 'youtube.firstSearchResult',
    description: 'first YouTube search result',
    match: [/(first|1st|top)\s+(search\s+)?(result|video)/i],
    spec: { kind: 'css', selector: 'ytd-video-renderer', nth: 'first' },
  },
  {
    id: 'youtube.videoPlayer',
    description: 'YouTube video player',
    match: [/video\s*player/i, /\bplayer\b/i],
    spec: { kind: 'css', selector: '#movie_player' },
  },
  {
    id: 'youtube.logo',
    description: 'YouTube logo',
    match: [/youtube\s*logo/i, /\blogo\b/i],
    roleHints: ['link', 'img'],
    spec: { kind: 'role', role: 'link', name: { source: 'youtube home', flags: 'i' } },
  },
  {
    id: 'youtube.videoTitle',
    description: 'video title heading on the watch page',
    match: [/video\s*title/i, /title\s*of\s*the\s*video/i],
    spec: { kind: 'css', selector: 'h1.ytd-watch-metadata' },
  },
];

/** Length of the longest substring of `description` any of the patterns match. */
function matchScore(entry, description) {
  let best = 0;
  for (const pattern of entry.match) {
    const found = description.match(pattern);
    if (found) best = Math.max(best, found[0].length);
  }
  return best;
}

/** Finds the catalog entry a target description refers to, if any. */
function lookupCatalog(target) {
  const description = target.description ?? '';
  const scored = TARGET_CATALOG.map((entry) => ({ entry, score: matchScore(entry, description) })).filter(
    (candidate) => candidate.score > 0,
  );
  if (scored.length === 0) return null;

  // The most specific description wins: "first search result" beats the more
  // general "search results" because it matches more of the wording.
  const topScore = Math.max(...scored.map((candidate) => candidate.score));
  const matches = scored.filter((candidate) => candidate.score === topScore).map((candidate) => candidate.entry);
  if (matches.length === 1) return matches[0];

  // Still tied - use the analyzer's role hint to break it, and refuse to guess
  // if it cannot.
  const byRole = target.role
    ? matches.filter((entry) => entry.roleHints?.includes(target.role.toLowerCase()))
    : [];
  if (byRole.length === 1) return byRole[0];

  throw new PipelineError(
    ErrorCode.AMBIGUOUS_TARGET,
    `Target "${description}" matches ${matches.length} known elements.`,
    {
      hint: `Candidates: ${matches.map((entry) => entry.id).join(', ')}. Describe the element more precisely in the manual test case.`,
    },
  );
}

/**
 * Resolves a canonical target into a locator spec plus the strategy that was
 * chosen, so the CLI can explain its reasoning.
 *
 * @param {{description: string, role?: string, name?: string, locator?: string}} target
 * @returns {{ spec: object, strategy: string, source: string, catalogId?: string }}
 */
export function resolveTarget(target) {
  if (!target || !target.description) {
    throw new PipelineError(
      ErrorCode.TARGET_NOT_UNDERSTOOD,
      'This step needs an element to act on, but no target was identified.',
    );
  }

  const catalogEntry = lookupCatalog(target);
  if (catalogEntry) {
    return {
      spec: catalogEntry.spec,
      strategy: catalogEntry.spec.kind,
      source: 'catalog',
      catalogId: catalogEntry.id,
    };
  }

  if (target.role && target.name) {
    return {
      spec: { kind: 'role', role: target.role, name: { source: escapeRegExp(target.name), flags: 'i' } },
      strategy: 'role',
      source: 'analyzer',
    };
  }

  if (target.name) {
    return {
      spec: { kind: 'text', text: target.name },
      strategy: 'text',
      source: 'analyzer',
    };
  }

  if (target.locator) {
    // Lowest priority: an explicit selector written by the test author.
    return { spec: { kind: 'css', selector: target.locator }, strategy: 'css', source: 'author' };
  }

  throw new PipelineError(
    ErrorCode.TARGET_NOT_UNDERSTOOD,
    `Could not resolve a locator for "${target.description}".`,
    {
      hint: [
        'Known elements for this application:',
        ...TARGET_CATALOG.map((entry) => `- ${entry.description}`),
        '',
        'Reword the manual step to refer to one of them, or add the element to TARGET_CATALOG in src/generator/selectorStrategy.js.',
      ].join('\n'),
    },
  );
}

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
