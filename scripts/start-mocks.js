/**
 * Starts all three offline stand-ins in one terminal.
 *
 *   npm run mocks
 *
 * `--offline` normally lets Playwright start these itself, through the
 * `webServer` block in playwright.config.js. Running them by hand is useful in
 * two situations:
 *
 *   - poking at a stand-in in a browser while writing a target catalog;
 *   - when Playwright's own webServer shutdown misbehaves. It tears the servers
 *     down *before* the reporters write their files, so a hang there leaves you
 *     with a stale report and no step report at all. Owning the servers
 *     yourself takes that step out of the run entirely:
 *
 *       terminal 1:  npm run mocks
 *       terminal 2:  npx playwright test generated/TC-YT
 *
 *     (no YT_MOCK, so playwright.config.js configures no webServer).
 *
 * Ctrl+C stops all three.
 */

import { spawn } from 'node:child_process';

const SERVERS = [
  { file: 'mock/server.js', name: 'YouTube', port: 4173 },
  { file: 'mock/orangehrm.js', name: 'OrangeHRM', port: 4174 },
  { file: 'mock/saucedemo.js', name: 'SauceDemo', port: 4175 },
  { file: 'mock/carinfo.js', name: 'CarInfo', port: 4176 },
];

const children = SERVERS.map(({ file, name, port }) => {
  const child = spawn(process.execPath, [file], { stdio: 'inherit' });
  child.on('error', (error) => {
    console.error(`Could not start the ${name} stand-in (${file}): ${error.message}`);
  });
  child.on('exit', (code, signal) => {
    // One server dying is usually a port clash, and the remaining two are no
    // use on their own - say so and take the whole set down.
    if (signal == null && code !== 0) {
      console.error(`\n${name} stand-in exited with code ${code}. Is port ${port} already in use?`);
      stop(1);
    }
  });
  return child;
});

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode == null && child.signalCode == null) child.kill();
  }
  process.exitCode = exitCode;
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0));

console.log(
  [
    '',
    'Offline stand-ins running:',
    ...SERVERS.map(({ name, port }) => `  ${name.padEnd(10)} http://127.0.0.1:${port}/`),
    '',
    'Run the generated tests from another terminal, without YT_MOCK set, so',
    'Playwright uses these rather than starting its own:',
    '',
    '  npx playwright test generated/TC-YT',
    '',
    'Ctrl+C stops all three.',
    '',
  ].join('\n'),
);
