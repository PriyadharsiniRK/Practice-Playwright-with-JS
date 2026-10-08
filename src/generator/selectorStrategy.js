/**
 * Selector strategy.
 *
 * The LLM describes *what* a step points at ("the username field"); this module
 * decides *how* to locate it. Selector priority, highest first:
 *
 *   1. getByRole()
 *   2. getByLabel()
 *   3. getByPlaceholder()
 *   4. getByText()
 *   5. locator()   - CSS, only when nothing better exists
 *
 * Each application (see ./applications/) pins its well-known elements to a
 * curated locator. Anything not in that catalog falls back to the role/name the
 * analyzer inferred; if even that is missing the pipeline fails loudly rather
 * than guessing a selector.
 */

import { ErrorCode, PipelineError } from '../errors.js';
import { DEFAULT_APPLICATION } from './applications/index.js';

/** Ordering used to rank candidate strategies. Lower index wins. */
export const STRATEGY_PRIORITY = ['role', 'label', 'placeholder', 'text', 'css'];

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
function lookupCatalog(target, application) {
  const description = target.description ?? '';
  const scored = application.targets
    .map((entry) => ({ entry, score: matchScore(entry, description) }))
    .filter((candidate) => candidate.score > 0);
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
    `Target "${description}" matches ${matches.length} known elements of ${application.name}.`,
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
 * @param {object} [application] the application under test (default: YouTube)
 * @returns {{ spec: object, strategy: string, source: string, catalogId?: string }}
 */
export function resolveTarget(target, application = DEFAULT_APPLICATION) {
  if (!target || !target.description) {
    throw new PipelineError(
      ErrorCode.TARGET_NOT_UNDERSTOOD,
      'This step needs an element to act on, but no target was identified.',
    );
  }

  const catalogEntry = lookupCatalog(target, application);
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
    return { spec: { kind: 'text', text: target.name }, strategy: 'text', source: 'analyzer' };
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
        `Known elements for ${application.name}:`,
        ...application.targets.map((entry) => `- ${entry.description}`),
        '',
        `Reword the manual step to refer to one of them, or add the element to src/generator/applications/${application.id}.js.`,
      ].join('\n'),
    },
  );
}

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
