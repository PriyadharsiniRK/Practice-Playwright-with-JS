/**
 * Runs generated specs through the Playwright runner and reports the outcome.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { ErrorCode, PipelineError } from '../errors.js';

const REPORT_PATH = path.join('reports', 'html', 'index.html');

/**
 * `playwright test <file>` treats its arguments as regular expressions matched
 * against test file paths. On Windows path.join() yields backslashes, and a
 * backslash is a regex escape - "generated\\TC-OHRM-001.spec.js" matches
 * nothing and the run dies with "No tests found". Forward slashes match on
 * every platform.
 */
const asTestFilter = (specFile) => specFile.split(path.sep).join('/');

/**
 * npm ships npx as a .cmd shim on Windows, which spawn() will not resolve
 * without the extension. Naming it explicitly avoids shell:true, which Node
 * deprecated for argument-bearing spawns (DEP0190) because the arguments are
 * concatenated rather than escaped.
 */
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

/**
 * @param {string[]} specFiles paths of generated spec files (empty = whole suite)
 * @param {{ offline?: boolean, headed?: boolean, cwd?: string, testDir?: string }} [options]
 * @returns {Promise<{ exitCode: number, reportPath: string }>}
 */
export function runTests(specFiles = [], options = {}) {
  const args = ['playwright', 'test', ...specFiles.map(asTestFilter)];
  if (options.headed) args.push('--headed');

  const env = { ...process.env };
  if (options.offline) env.YT_MOCK = '1';
  if (options.testDir) env.GENERATED_DIR = options.testDir;

  return new Promise((resolve, reject) => {
    const child = spawn(NPX, args, {
      cwd: options.cwd ?? process.cwd(),
      env,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      reject(
        new PipelineError(ErrorCode.TEST_EXECUTION_FAILED, `Could not start Playwright: ${error.message}`, {
          hint: 'Run `npm install` and `npx playwright install chromium` first.',
        }),
      );
    });

    child.on('close', (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, reportPath: REPORT_PATH });
    });
  });
}

export { REPORT_PATH, NPX, asTestFilter };
