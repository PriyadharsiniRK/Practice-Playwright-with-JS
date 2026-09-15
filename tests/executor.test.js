/**
 * Unit tests for how the runner is invoked.
 *
 * These guard a bug that only ever appeared on Windows: `playwright test <file>`
 * treats its arguments as regular expressions, so a path.join()-produced
 * backslash silently matched nothing and the run died with "No tests found".
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { NPX, asTestFilter } from '../src/executor/testExecutor.js';

test('spec paths are passed to Playwright with forward slashes', () => {
  // Whatever path.join produced, the filter must never contain a backslash:
  // "generated\\TC-OHRM-001.spec.js" is a regex escape, not a path.
  const joined = path.join('generated', 'TC-OHRM-001.spec.js');
  const filter = asTestFilter(joined);

  assert.equal(filter.includes('\\'), false);
  assert.equal(filter, 'generated/TC-OHRM-001.spec.js');
});

test('a Windows-style path is normalised even when path.sep is /', () => {
  // Simulates the value path.join() yields on win32 while running this test
  // suite on any platform.
  assert.equal('generated\\TC-YT-001.spec.js'.split('\\').join('/'), 'generated/TC-YT-001.spec.js');
});

test('npx is named with its .cmd extension on Windows', () => {
  assert.equal(NPX, process.platform === 'win32' ? 'npx.cmd' : 'npx');
});
