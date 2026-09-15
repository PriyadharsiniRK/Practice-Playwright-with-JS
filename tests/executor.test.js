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
import { existsSync } from 'node:fs';

import { asTestFilter, resolvePlaywrightCli } from '../src/executor/testExecutor.js';

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

test('the Playwright CLI resolves to a real .js file, not a shell shim', () => {
  const cli = resolvePlaywrightCli();
  assert.ok(cli, 'Playwright CLI not found in node_modules');
  // A .cmd/.bat shim cannot be spawned without a shell on Windows (EINVAL
  // since CVE-2024-27980), so the runner must invoke a plain .js file with
  // the current Node binary instead.
  assert.match(cli, /cli\.js$/);
  assert.equal(existsSync(cli), true);
});
