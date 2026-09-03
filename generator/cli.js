#!/usr/bin/env node
/**
 * ai-testgen — turns a plain-English test spec into a Playwright spec file.
 *
 * Two engines produce the same kind of output:
 *   ai       (default) asks Claude to write the file
 *   offline  (--offline, or the automatic fallback) uses the built-in grammar
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';

import { parseSpec, slugify } from './parse-spec.js';
import { compileSteps } from './offline-engine.js';
import { renderSpec } from './render.js';
import { generate, hasCredentials, DEFAULT_MODEL } from './ai-engine.js';

const USAGE = `
ai-testgen — generate a Playwright test from a plain-English spec

Usage:
  npm run gen -- --spec examples/login.spec.txt
  npm run gen -- --prompt "log in as a valid user and land on the dashboard" --url https://example.com
  npm run gen -- --spec examples/login.spec.txt --offline --dry-run

Options:
  --spec <file>     Spec file to read (see examples/).
  --prompt <text>   Inline spec; one step per line or per sentence.
  --url <url>       Starting URL, overriding any URL: header in the spec.
  --name <title>    Test title, overriding any Test: header in the spec.
  --out <file>      Output path (default: tests/<slug>.spec.js).
  --offline         Use the built-in grammar instead of calling the API.
  --model <id>      Model for the AI engine (default: ${DEFAULT_MODEL}).
  --dry-run         Print the generated file instead of writing it.
  --force           Overwrite an existing output file.
  -h, --help        Show this help.
`.trimStart();

const OPTIONS = {
  spec: { type: 'string' },
  prompt: { type: 'string' },
  url: { type: 'string' },
  name: { type: 'string' },
  out: { type: 'string' },
  offline: { type: 'boolean', default: false },
  model: { type: 'string', default: DEFAULT_MODEL },
  'dry-run': { type: 'boolean', default: false },
  force: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
};

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    ({ values: args } = parseArgs({ args: argv, options: OPTIONS }));
  } catch (error) {
    fail(`${error.message}\n\n${USAGE}`);
  }

  if (args.help || (!args.spec && !args.prompt)) {
    process.stdout.write(USAGE);
    return args.help ? 0 : 1;
  }

  // --- Read the spec ----------------------------------------------------
  let source = args.spec;
  let text;
  if (args.spec) {
    if (!fs.existsSync(args.spec)) fail(`Spec file not found: ${args.spec}`);
    text = fs.readFileSync(args.spec, 'utf8');
  } else {
    text = args.prompt.includes('\n') ? args.prompt : args.prompt.split(/(?:;|\s+then\s+)/i).join('\n');
    source = 'inline --prompt';
  }

  const spec = parseSpec(text, { title: args.name, url: args.url });
  if (spec.steps.length === 0) fail('The spec contains no steps.');

  // --- Generate ---------------------------------------------------------
  let engine = args.offline ? 'offline' : 'ai';
  if (engine === 'ai' && !hasCredentials()) {
    warn('No ANTHROPIC_API_KEY found — falling back to the offline engine.');
    engine = 'offline';
  }

  let code;
  let model;
  const warnings = [];

  if (engine === 'ai') {
    process.stderr.write(`Generating with ${args.model}`);
    const tick = setInterval(() => process.stderr.write('.'), 1500);
    try {
      const result = await generate(spec, { model: args.model });
      code = result.code;
      model = result.model;
      warnings.push(...result.notes);
    } catch (error) {
      clearInterval(tick);
      process.stderr.write('\n');
      fail(error.message);
    }
    clearInterval(tick);
    process.stderr.write('\n');
  } else {
    const compiled = compileSteps(spec.steps);
    warnings.push(...compiled.warnings);
    code = renderSpec(spec, compiled.statements, { engine: 'offline', source });
  }

  // --- Validate ---------------------------------------------------------
  const syntaxError = checkSyntax(code);
  if (syntaxError) {
    warn(`Generated file has a syntax error: ${syntaxError}`);
    warnings.push('The generated file did not pass a syntax check — review it closely.');
  }

  // --- Emit -------------------------------------------------------------
  const outPath = args.out || path.join('tests', `${slugify(spec.title)}.spec.js`);

  if (args['dry-run']) {
    process.stdout.write(code);
  } else {
    if (fs.existsSync(outPath) && !args.force) {
      fail(`${outPath} already exists. Pass --force to overwrite, or --out to write elsewhere.`);
    }
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, code);
    process.stderr.write(`Wrote ${outPath} (${engine} engine${model ? `, ${model}` : ''})\n`);
  }

  for (const message of warnings) warn(message);
  return 0;
}

/** Runs `node --check` on the generated source so we never ship a broken file. */
export function checkSyntax(code) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ai-testgen-')), 'candidate.mjs');
  try {
    fs.writeFileSync(file, code);
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    return null;
  } catch (error) {
    const stderr = String(error.stderr || error.message);
    const line = stderr.split('\n').find((l) => /SyntaxError/.test(l));
    return line ? line.trim() : 'unknown syntax error';
  } finally {
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  }
}

function warn(message) {
  process.stderr.write(`warning: ${message}\n`);
}

function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

// Only run when invoked directly, so the tests can import main().
if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  process.exitCode = await main();
}
