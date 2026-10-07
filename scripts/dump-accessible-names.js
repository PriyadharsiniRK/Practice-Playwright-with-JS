/**
 * Prints the accessibility tree of a live page - the roles and names
 * `getByRole()` actually matches on.
 *
 *   node scripts/dump-accessible-names.js "https://www.tnebnet.org/awp/login?locale=en"
 *   node scripts/dump-accessible-names.js <url> --click "e-Invoice"
 *   HEADED=1 node scripts/dump-accessible-names.js <url>
 *
 * This exists because a target catalog written without the live site in front
 * of you is a guess, and a guess that passes offline is the most misleading
 * kind: the stand-in and the catalog were written by the same hand, so they
 * agree no matter what the real page says. The cure is to read the real page's
 * accessible names.
 *
 * `--click <name>` clicks a link, button or tab with that accessible name
 * before dumping, for fields that live behind a tab and are not in the DOM
 * until it opens.
 *
 * The output is Playwright's own aria snapshot, so a line like
 *
 *   - textbox "Consumer No."
 *
 * means `getByRole('textbox', { name: 'Consumer No.' })` finds it. A field that
 * shows up as `textbox` with no name but a `/placeholder:` child needs
 * `getByPlaceholder()` instead - which is the next tier down in
 * src/generator/selectorStrategy.js.
 *
 * Read-only: nothing here writes to the repository.
 */

import { chromium } from '@playwright/test';

import { loadProjectEnv } from '../src/util/loadEnv.js';

loadProjectEnv();

const args = process.argv.slice(2);
const url = args.find((arg) => !arg.startsWith('--'));
const clickIndex = args.indexOf('--click');
const clickName = clickIndex === -1 ? null : args[clickIndex + 1];

if (!url) {
  console.error('Usage: node scripts/dump-accessible-names.js <url> [--click "<link or button name>"]');
  console.error('       HEADED=1 to watch it, PW_CHANNEL=chrome to use an installed browser.');
  process.exit(1);
}

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  headless: process.env.HEADED !== '1',
});
const page = await browser.newPage({ locale: 'en-US' });

try {
  console.log(`\nOpening ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  console.log(`  page title : ${JSON.stringify(await page.title())}`);
  console.log(`  final URL  : ${page.url()}`);
  console.log(`  document   : lang=${JSON.stringify(await page.locator('html').getAttribute('lang'))}`);

  if (clickName) {
    console.log(`\nClicking "${clickName}" first...`);
    // A tab strip is links on some sites and buttons on others, so try any
    // clickable role with that name rather than guessing.
    const clickable = page
      .getByRole('link', { name: clickName })
      .or(page.getByRole('button', { name: clickName }))
      .or(page.getByRole('tab', { name: clickName }))
      .first();
    await clickable.click({ timeout: 20_000 });
    await page.waitForLoadState('domcontentloaded');
    console.log(`  now at     : ${page.url()}`);
  }

  console.log('\nAccessibility tree (role + the name getByRole matches on):\n');
  console.log(await page.locator('body').ariaSnapshot());
  console.log('');
} finally {
  await browser.close();
}
