/**
 * Parses a plain-English test spec into the shape both engines consume.
 *
 * A spec file looks like:
 *
 *   Test: Successful login
 *   URL: https://example.com/login
 *   Tags: @smoke @auth
 *
 *   - go to /login
 *   - fill "Email" with "user@example.com"
 *   - click "Sign in"
 *   - expect url to contain "/dashboard"
 *
 * Headers are optional; any line that is not a header and not a comment is a
 * step. Leading list markers (`-`, `*`, `1.`) are stripped.
 */

const HEADER = /^(test|title|name|url|base ?url|tags?|description)\s*:\s*(.*)$/i;
const LIST_MARKER = /^\s*(?:[-*+]|\d+[.)])\s+/;

export function parseSpec(text, { title, url } = {}) {
  const spec = {
    title: title || '',
    url: url || '',
    description: '',
    tags: [],
    steps: [],
  };

  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    const header = line.match(HEADER);
    if (header) {
      const key = header[1].toLowerCase().replace(/\s+/g, '');
      const value = header[2].trim();
      if (!value) continue;
      if (key === 'test' || key === 'title' || key === 'name') {
        if (!title) spec.title = value;
      } else if (key === 'url' || key === 'baseurl') {
        if (!url) spec.url = value;
      } else if (key === 'tag' || key === 'tags') {
        spec.tags.push(...value.split(/\s+/).map((t) => (t.startsWith('@') ? t : `@${t}`)));
      } else if (key === 'description') {
        spec.description = value;
      }
      continue;
    }

    // "Steps:" style section markers carry no content of their own.
    if (/^steps\s*:?$/i.test(line)) continue;

    spec.steps.push(line.replace(LIST_MARKER, '').trim());
  }

  if (!spec.title) spec.title = spec.steps[0] || 'generated test';
  return spec;
}

/** Turns a test title into a safe `tests/<slug>.spec.js` filename. */
export function slugify(title) {
  const slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'generated';
}
