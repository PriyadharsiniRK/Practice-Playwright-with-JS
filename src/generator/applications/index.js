/**
 * Application registry.
 *
 * A test case is bound to one application, chosen by the hostname of its first
 * navigation step. That keeps element vocabularies from colliding: "search box"
 * means something different on YouTube than it does in OrangeHRM's sidebar.
 */

import { ErrorCode, PipelineError } from '../../errors.js';
import { youtube } from './youtube.js';
import { orangehrm } from './orangehrm.js';
import { saucedemo } from './saucedemo.js';

export const APPLICATIONS = [youtube, orangehrm, saucedemo];

/** The application used when a test case names no recognisable host. */
export const DEFAULT_APPLICATION = youtube;

export const applicationById = (id) => APPLICATIONS.find((app) => app.id === id);

/** @returns {object|undefined} the application that owns a URL's hostname */
export function applicationForUrl(url) {
  let hostname;
  try {
    ({ hostname } = new URL(url));
  } catch {
    return undefined;
  }
  return APPLICATIONS.find((app) => app.hosts.some((pattern) => pattern.test(hostname)));
}

/**
 * Picks the application for a test case from the first URL its steps mention,
 * falling back to any application whose name the document itself uses.
 *
 * The URL is the reliable signal and is always tried first. The name is for
 * documents that never spell out a URL - "User is on SauceDemo login page" is
 * how a manual tester states which site is under test, and without this the
 * test case would silently bind to the default application instead.
 *
 * Raw (pre-analysis) and canonical test cases are both accepted.
 */
export function applicationForTestCase(testCase) {
  for (const step of testCase.steps ?? []) {
    const text = step.text ?? step.originalText ?? '';
    const url = step.value?.startsWith('http') ? step.value : text.match(/\bhttps?:\/\/[^\s"'<>]+/i)?.[0];
    const application = url && applicationForUrl(url);
    if (application) return application;
  }
  return applicationNamedIn(testCase);
}

/** @returns {object|undefined} an application whose nameHints the document uses */
export function applicationNamedIn(testCase) {
  const prose = [
    testCase.title ?? '',
    ...(testCase.preconditions ?? []),
    ...(testCase.steps ?? []).map((step) => step.text ?? step.originalText ?? ''),
  ].join('\n');

  return APPLICATIONS.find((app) => app.nameHints?.some((pattern) => pattern.test(prose)));
}

/** Resolves an application by id, failing with the list of known ids. */
export function requireApplication(id) {
  const application = applicationById(id);
  if (!application) {
    throw new PipelineError(ErrorCode.GENERATION_FAILED, `Unknown application "${id}".`, {
      hint: `Known applications: ${APPLICATIONS.map((app) => app.id).join(', ')}`,
    });
  }
  return application;
}

/**
 * The application a whole document is about.
 *
 * A test case only names the site in some of its steps - "Price sorting is
 * selected" could be any site on earth - but a manual test document covers one
 * application, so a test case that names none inherits the one its siblings
 * name. Only unambiguous documents supply this fallback: if two applications
 * appear, an unnamed test case is left unresolved rather than assigned to
 * whichever came first.
 *
 * @param {Array<object>} testCases raw or canonical test cases from one file
 * @returns {object|undefined}
 */
export function applicationForDocument(testCases) {
  const resolved = new Set();
  for (const testCase of testCases ?? []) {
    const application = applicationForTestCase(testCase);
    if (application) resolved.add(application);
  }
  return resolved.size === 1 ? [...resolved][0] : undefined;
}
