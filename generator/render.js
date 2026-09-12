/** Renders compiled statements into a complete Playwright spec file. */

const HEADER_NOTE =
  'Generated test — review it before trusting it. Locators are guesses until they run green.';

/**
 * @param {object} spec parsed spec ({title, url, tags, description})
 * @param {string[]} statements Playwright statements, already `;`-terminated
 * @param {object} meta {engine, model, source}
 */
export function renderSpec(spec, statements, meta = {}) {
  const lines = [];

  lines.push(`// ${HEADER_NOTE}`);
  lines.push(`// Engine: ${meta.engine}${meta.model ? ` (${meta.model})` : ''}`);
  if (meta.source) lines.push(`// Source spec: ${meta.source}`);
  lines.push("import { test, expect } from '@playwright/test';");
  lines.push('');

  const title = [spec.title, ...(spec.tags || [])].join(' ').trim();
  if (spec.description) lines.push(`// ${spec.description}`);
  lines.push(`test(${quote(title)}, async ({ page }) => {`);

  const body = [...statements];
  // A spec with a URL but no explicit navigation still needs to open the page.
  if (spec.url && !body.some((s) => s.includes('page.goto('))) {
    body.unshift(`await page.goto(${quote(spec.url)});`);
  }
  if (body.length === 0) {
    body.push('// TODO: no steps were provided.');
  }

  for (const statement of body) lines.push(`  ${statement}`);
  lines.push('});');
  lines.push('');

  return lines.join('\n');
}

function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
