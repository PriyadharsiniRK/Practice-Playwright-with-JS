#!/usr/bin/env node
/**
 * playwright-test-generator CLI.
 *
 *   node src/cli.js parse             [TC-ID] [--input <file>]
 *   node src/cli.js analyze           [TC-ID] [--provider auto|llm|heuristic]
 *   node src/cli.js generate          [TC-ID]
 *   node src/cli.js generate-and-test [TC-ID] [--headed]
 *   node src/cli.js report
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadProjectEnv } from './util/loadEnv.js';
import { PipelineError } from './errors.js';
import { parseDocument, selectTestCase } from './parser/index.js';
import { analyzeTestCase, createProvider } from './analyzer/testCaseAnalyzer.js';
import { assertionless, generateSpec } from './generator/playwrightGenerator.js';
import { resolveTarget } from './generator/selectorStrategy.js';
import {
  DEFAULT_APPLICATION,
  applicationForDocument,
  applicationForTestCase,
} from './generator/applications/index.js';
import { REPORT_PATH, readResults, runTests, showReport as spawnReportServer } from './executor/testExecutor.js';
import { logger } from './util/logger.js';

loadProjectEnv();

const DEFAULT_INPUT = path.join('input', 'youtube-tests.xlsx');
const DEFAULT_OUTPUT_DIR = 'generated';

const HELP_FLAGS = ['-h', '--help', 'help'];

function parseArgs(argv) {
  const options = {
    // `cli.js --help` asks for help, not for a command called "--help".
    command: HELP_FLAGS.includes(argv[0]) ? undefined : argv[0],
    help: HELP_FLAGS.includes(argv[0]),
    testCaseId: undefined,
    input: DEFAULT_INPUT,
    outDir: DEFAULT_OUTPUT_DIR,
    provider: 'auto',
    headed: false,
    screenshots: true,
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
      case '--headed':
        options.headed = true;
        break;
      case '--no-screenshots':
        options.screenshots = false;
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
      --headed            run the browser headed
      --no-screenshots    omit the per-step screenshots from generated specs
  -h, --help              show this help
`;

/** Stage 1+2: read the document and pick the requested test case(s). */
async function loadTestCases(options) {
  logger.heading(`Reading test case ${options.testCaseId ?? '(all)'}...`);
  const parsed = await parseDocument(options.input);
  const format = path.extname(options.input).toLowerCase() === '.docx' ? 'Word' : 'Excel';
  logger.step(`${format} parsed (${options.input})`);
  const selected = selectTestCase(parsed, options.testCaseId);
  logger.step(`Test case identified: ${selected.map((t) => t.id).join(', ')}`);
  for (const testCase of selected) {
    const where = selected.length > 1 ? ` in ${testCase.id}` : '';
    logger.step(`${testCase.steps.length} manual steps detected${where}`);
  }
  return selected;
}

/**
 * Stage 3+4: interpret each step into the canonical model.
 *
 * When a document holds several test cases, one that cannot be automated (an
 * unsupported step, an unknown element) is reported and skipped rather than
 * stopping the others. Asking for a single test case still fails outright.
 *
 * @returns {Promise<{ analyzed: object[], skipped: { id: string, error: PipelineError }[] }>}
 */
async function analyze(rawTestCases, options) {
  const provider = createProvider(options.provider);
  logger.heading(`Analyzing steps... (analyzer: ${provider.name})`);
  if (provider.name === 'heuristic' && options.provider === 'auto') {
    logger.warn('No ANTHROPIC_API_KEY found - using the rule-based analyzer.');
  }

  const analyzed = [];
  const skipped = [];
  // Test cases that never name the site inherit the one the document names.
  const documentApplication = applicationForDocument(rawTestCases);
  for (const rawTestCase of rawTestCases) {
    if (rawTestCases.length > 1) logger.info(`  ${rawTestCase.id}`);
    const application =
      applicationForTestCase(rawTestCase) ?? documentApplication ?? DEFAULT_APPLICATION;
    let canonical;
    try {
      canonical = await analyzeTestCase(rawTestCase, {
        provider,
        application,
        onStep: (step) => {
          const detail = describeStep(step, application);
          logger.step(`Step ${step.stepNumber} → ${step.action}${detail ? `  ${detail}` : ''}`);
        },
      });
    } catch (error) {
      if (!(error instanceof PipelineError) || rawTestCases.length === 1) throw error;
      logger.error(`${rawTestCase.id} skipped - ${error.format()}`);
      logger.blank();
      skipped.push({ id: rawTestCase.id, error });
      continue;
    }
    logger.step(`${rawTestCase.id} → application: ${application.name}`);
    analyzed.push({ raw: rawTestCase, canonical, provider: provider.name });
  }
  return { analyzed, skipped };
}

/**
 * A skipped test case must not leave an older generated spec behind: it would
 * keep running under that id while no longer matching the manual test case.
 */
function removeStaleSpecs(skipped, options) {
  for (const { id } of skipped) {
    const filePath = path.join(options.outDir, `${id}.spec.js`);
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
      logger.warn(`Removed ${filePath} - it no longer matches manual test case ${id}.`);
    }
  }
}

/** Summary line for skipped test cases; returns the exit code they imply. */
function reportSkipped(skipped) {
  if (skipped.length === 0) return 0;
  logger.blank();
  logger.error(
    `${skipped.length} test case(s) could not be automated and were skipped: ` +
      `${skipped.map((entry) => `${entry.id} (${entry.error.code})`).join(', ')}`,
  );
  return 1;
}

/** One-line explanation of what the framework decided for a step. */
function describeStep(step, application) {
  if (step.action === 'NAVIGATE') return `url = ${step.value}`;
  const bits = [];
  if (step.target) {
    const resolved = resolveTarget(step.target, application);
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
      sourceFile: entry.raw.source,
      provider: entry.provider,
      screenshots: options.screenshots,
    });
    const filePath = path.join(options.outDir, fileName);
    fs.writeFileSync(filePath, code, 'utf8');
    logger.step(filePath);
    if (assertionless(entry.canonical)) {
      logger.warn(
        `${entry.canonical.id} states no expected result as a step, so it passes whenever ` +
          'its steps execute. Add a "Verify ..." step to the manual test case.',
      );
    }
    written.push(filePath);
  }
  return written;
}

/** One line per test case with its own result, then the totals. */
function reportOutcomes(ids, exitCode) {
  const outcomes = readResults();
  if (outcomes.size === 0) {
    // No per-test results (the run could not start): fall back to the exit code.
    if (exitCode === 0) logger.step(`${ids.join(', ')} passed`);
    else logger.error(`Test run failed (Playwright exit code ${exitCode})`);
    return;
  }
  const counts = {};
  for (const id of ids) {
    const outcome = outcomes.get(id) ?? 'not run';
    counts[outcome] = (counts[outcome] ?? 0) + 1;
    if (outcome === 'passed') logger.step(`${id} passed`);
    else if (outcome === 'flaky') logger.warn(`${id} passed on retry (flaky)`);
    else if (outcome === 'skipped') logger.warn(`${id} skipped`);
    else logger.error(`${id} ${outcome}`);
  }
  logger.info(Object.entries(counts).map(([outcome, n]) => `${n} ${outcome}`).join(', '));
}

async function showReport() {
  if (!fs.existsSync(REPORT_PATH)) {
    logger.warn(`No report at ${REPORT_PATH}. Run the tests first.`);
    return 1;
  }
  return spawnReportServer(path.dirname(REPORT_PATH));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.command || options.help) {
    console.log(USAGE);
    // Asking for help succeeds; being given no command at all does not.
    return options.help ? 0 : 1;
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
      const { analyzed, skipped } = await analyze(cases, options);
      logger.blank();
      console.log(JSON.stringify(analyzed.map((entry) => entry.canonical), null, 2));
      return reportSkipped(skipped);
    }
    case 'generate': {
      const cases = await loadTestCases(options);
      const { analyzed, skipped } = await analyze(cases, options);
      generate(analyzed, options);
      removeStaleSpecs(skipped, options);
      return reportSkipped(skipped);
    }
    case 'generate-and-test': {
      const cases = await loadTestCases(options);
      const { analyzed, skipped } = await analyze(cases, options);
      const files = generate(analyzed, options);
      removeStaleSpecs(skipped, options);
      if (files.length === 0) return reportSkipped(skipped);

      logger.heading('Executing test...');
      const { exitCode, reportPath } = await runTests(files, {
        headed: options.headed,
        testDir: options.outDir,
      });
      logger.blank();
      reportOutcomes(analyzed.map((entry) => entry.canonical.id), exitCode);
      logger.heading('Report:');
      logger.info(reportPath);
      return Math.max(exitCode, reportSkipped(skipped));
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
