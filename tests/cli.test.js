/**
 * Unit tests for the CLI's handling of a document in which one test case
 * cannot be automated.
 *
 * input/carinfo-tests.docx keeps the original TC-CI-001 verbatim, and its
 * "Select Google" step names an element the framework does not know. That one
 * test case must be skipped with its error code, the others must still be
 * generated, any older spec for the skipped id must be removed, and the exit
 * code must still be non-zero so the gap cannot go unnoticed.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const runCli = (args) =>
  spawnSync(process.execPath, ['src/cli.js', ...args], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });

test('one unautomatable test case is skipped without stopping the rest of the document', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-skip-'));
  // A spec left over from an earlier version of the manual test case.
  fs.writeFileSync(path.join(outDir, 'TC-CI-001.spec.js'), '// stale\n');

  const result = runCli(['generate', '--input', 'input/carinfo-tests.docx', '--provider', 'heuristic', '--out', outDir]);
  const output = result.stdout + result.stderr;

  assert.equal(result.status, 1);
  assert.match(output, /TC-CI-001 skipped - TARGET_NOT_UNDERSTOOD/);
  assert.match(output, /could not be automated and were skipped: TC-CI-001 \(TARGET_NOT_UNDERSTOOD\)/);
  assert.equal(fs.existsSync(path.join(outDir, 'TC-CI-001.spec.js')), false);
  for (const id of ['TC-CI-002', 'TC-CI-003', 'TC-CI-004', 'TC-CI-005']) {
    assert.equal(fs.existsSync(path.join(outDir, `${id}.spec.js`)), true, `${id} was not generated`);
  }
});

test('asking for the unautomatable test case by id still fails outright', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-single-'));
  const result = runCli([
    'generate', 'TC-CI-001', '--input', 'input/carinfo-tests.docx', '--provider', 'heuristic', '--out', outDir,
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /TARGET_NOT_UNDERSTOOD/);
  assert.deepEqual(fs.readdirSync(outDir), []);
});
