#!/usr/bin/env node
/**
 * playwright-test-generator CLI.
 *
 *   node src/cli.js parse             [TC-ID] [--input <file>]
 *   node src/cli.js analyze           [TC-ID] [--provider auto|llm|heuristic]
 *   node src/cli.js generate          [TC-ID]
 *   node src/cli.js generate-and-test [TC-ID] [--offline] [--headed]
 *   node src/cli.js report
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PipelineError } from './errors.js';
import { parseDocument, selectTestCase } from './parser/index.js';
import { analyzeTestCase, createProvider } from './analyzer/testCaseAnalyzer.js';
import { generateSpec } from './generator/playwrightGenerator.js';
import { resolveTarget } from './generator/selectorStrategy.js';
import { REPORT_PATH, runTests } from './executor/testExecutor.js';
import { logger } from './util/logger.js';

const DEFAULT_INPUT = path.join('input', 'youtube-tests.xlsx');
const DEFAULT_OUTPUT_DIR = 'generated';
/** Origin used by `--offline`, served by mock/server.js. */
const OFFLINE_BASE_URL = 'http://127.0.0.1:4173';

function parseArgs(argv) {
  const options = {
    command: argv[0],
    testCaseId: undefined,
    input: DEFAULT_INPUT,
    outDir: DEFAULT_OUTPUT_DIR,
    provider: 'auto',
    offline: false,
    headed: false,
  };
  const rest = argv.slice(1);
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    switch (arg) {
      case '--input':
      case '-i':
        options.input = rest[++i];
        break;
      case '--out':
      case '-o':
        options.outDir = rest[++i];
        break;
      case '--provider':
      case '-p':
        options.provider = rest[++i];
        break;
      case '--offline':
        options.offline = true;
        break;
      case '--headed':
        options.headed = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option "${arg}"`);
        }
        options.testCaseId = arg;
    }
  }
  return options;
}

const USAGE = `
playwright-test-generator - turn manual test cases into Playwright tests

Usage:
  npm run parse             [-- TC-YT-001]
  npm run analyze           [-- TC-YT-001]
  npm run generate          [-- TC-YT-001]
  npm run generate-and-test -- TC-YT-001
  npm run report

Options:
  -i, --input <file>      manual test case document (.xlsx or .docx)
                          default: ${DEFAULT_INPUT}
  -o, --out <dir>         output directory for generated specs (default: ${DEFAULT_OUTPUT_DIR})
  -p, --provider <mode>   auto | llm | heuristic  (default: auto)
      --offline           generate and run against the bundled local stand-in
                          instead of youtube.com
      --headed            run the browser headed
  -h, --help              show this help
`;

/** Stage 1+2: read the document and pick the requested test case(s). */
async function loadTestCases(options) {
  logger.heading(`Reading test case ${options.testCaseId ?? '(all)'}...`);
  const parsed = await parseDocument(options.input);
  logger.step(`${path.extname(options.input).replace('.', '').toUpperCase()} parsed (${options.input})`);
  const selected = selectTestCase(parsed, options.testCaseId);
  logger.step(`Test case identified: ${selected.map((t) => t.id).join(', ')}`);
  for (const testCase of selected) {
    logger.step(`${testCase.steps.length} manual steps detected in ${testCase.id}`);
  }
  return selected;
}

/** Stage 3+4: interpret each step into the canonical model. */
async function analyze(rawTestCases, options) {
  const provider = createProvider(options.provider);
  logger.heading(`Analyzing steps... (analyzer: ${provider.name})`);
  if (provider.name === 'heuristic' && options.provider === 'auto') {
    logger.warn('No ANTHROPIC_API_KEY found - using the offline rule-based analyzer.');
  }

  const analyzed = [];
  for (const rawTestCase of rawTestCases) {
    if (rawTestCases.length > 1) logger.info(`  ${rawTestCase.id}`);
    const canonical = await analyzeTestCase(rawTestCase, {
      provider,
      onStep: (step) => {
        const detail = describeStep(step);
        logger.step(`Step ${step.stepNumber} -> ${step.action}${detail ? `  ${detail}` : ''}`);
      },
    });
    analyzed.push({ raw: rawTestCase, canonical, provider: provider.name });
  }
  return analyzed;
}

/** One-line explanation of what the framework decided for a step. */
function describeStep(step) {
  if (step.action === 'NAVIGATE') return `url = ${step.value}`;
  const bits = [];
  if (step.target) {
    const resolved = resolveTarget(step.target);
    bits.push(`target = ${resolved.catalogId ?? step.target.description} [${resolved.strategy}]`);
  }
  if (step.value) bits.push(`value = ${step.value}`);
  return bits.join(', ');
}

/** Stage 5+6: emit deterministic Playwright code. */
function generate(analyzed, options) {
  logger.heading('Generating Playwright test...');
  fs.mkdirSync(options.outDir, { recursive: true });

  const written = [];
  for (const entry of analyzed) {
    const { fileName, code } = generateSpec(entry.canonical, {
      baseUrl: options.offline ? OFFLINE_BASE_URL : undefined,
      sourceFile: entry.raw.source,
      provider: entry.provider,
    });
    const filePath = path.join(options.outDir, fileName);
    fs.writeFileSync(filePath, code, 'utf8');
    logger.step(filePath);
    written.push(filePath);
  }
  if (options.offline) {
    logger.warn(`Offline mode: generated tests target ${OFFLINE_BASE_URL} instead of youtube.com.`);
  }
  return written;
}

async function showReport() {
  if (!fs.existsSync(REPORT_PATH)) {
    logger.warn(`No report at ${REPORT_PATH}. Run the tests first.`);
    return 1;
  }
  const child = spawn('npx', ['playwright', 'show-report', path.dirname(REPORT_PATH)], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return new Promise((resolve) => child.on('close', (code) => resolve(code ?? 0)));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.command || options.help) {
    console.log(USAGE);
    return options.command ? 0 : 1;
  }

  switch (options.command) {
    case 'parse': {
      const cases = await loadTestCases(options);
      logger.blank();
      console.log(JSON.stringify(cases, null, 2));
      return 0;
    }
    case 'analyze': {
      const cases = await loadTestCases(options);
      const analyzed = await analyze(cases, options);
      logger.blank();
      console.log(JSON.stringify(analyzed.map((entry) => entry.canonical), null, 2));
      return 0;
    }
    case 'generate': {
      const cases = await loadTestCases(options);
      const analyzed = await analyze(cases, options);
      generate(analyzed, options);
      return 0;
    }
    case 'generate-and-test': {
      const cases = await loadTestCases(options);
      const analyzed = await analyze(cases, options);
      const files = generate(analyzed, options);

      logger.heading('Executing test...');
      const { exitCode, reportPath } = await runTests(files, {
        offline: options.offline,
        headed: options.headed,
        testDir: options.outDir,
      });
      logger.blank();
      const names = analyzed.map((entry) => entry.canonical.id).join(', ');
      if (exitCode === 0) logger.step(`${names} passed`);
      else logger.error(`${names} failed (Playwright exit code ${exitCode})`);
      logger.heading('Report:');
      logger.info(reportPath);
      return exitCode;
    }
    case 'report':
      return showReport();
    default:
      logger.error(`Unknown command "${options.command}"`);
      console.log(USAGE);
      return 1;
  }
}

main()
  .then((code) => {
    process.exitCode = code ?? 0;
  })
  .catch((error) => {
    logger.blank();
    if (error instanceof PipelineError) {
      logger.error(error.format());
    } else {
      logger.error(error.stack ?? String(error));
    }
    process.exitCode = 1;
  });
