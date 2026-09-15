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

export const APPLICATIONS = [youtube, orangehrm];

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
 * Picks the application for a test case from the first URL its steps mention.
 * Raw (pre-analysis) and canonical test cases are both accepted.
 */
export function applicationForTestCase(testCase) {
  for (const step of testCase.steps ?? []) {
    const text = step.text ?? step.originalText ?? '';
    const url = step.value?.startsWith('http') ? step.value : text.match(/\bhttps?:\/\/[^\s"'<>]+/i)?.[0];
    const application = url && applicationForUrl(url);
    if (application) return application;
  }
  return undefined;
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
