/**
 * Runs generated specs through the Playwright runner and reports the outcome.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { ErrorCode, PipelineError } from '../errors.js';

const REPORT_PATH = path.join('reports', 'html', 'index.html');

/**
 * @param {string[]} specFiles paths of generated spec files (empty = whole suite)
 * @param {{ offline?: boolean, headed?: boolean, cwd?: string, testDir?: string }} [options]
 * @returns {Promise<{ exitCode: number, reportPath: string }>}
 */
export function runTests(specFiles = [], options = {}) {
  const args = ['playwright', 'test', ...specFiles];
  if (options.headed) args.push('--headed');

  const env = { ...process.env };
  if (options.offline) env.YT_MOCK = '1';
  if (options.testDir) env.GENERATED_DIR = options.testDir;

  return new Promise((resolve, reject) => {
    const child = spawn('npx', args, {
      cwd: options.cwd ?? process.cwd(),
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
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

export { REPORT_PATH };
