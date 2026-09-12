import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSpec, slugify } from '../parse-spec.js';
import { compileSteps } from '../offline-engine.js';
import { renderSpec } from '../render.js';
import { checkSyntax } from '../cli.js';
import { extractCode } from '../ai-engine.js';

test('parseSpec reads headers, comments and list markers', () => {
  const spec = parseSpec(
    [
      '# a comment',
      'Test: Successful login',
      'URL: /login',
      'Tags: smoke @auth',
      'Description: signs in',
      '',
      'Steps:',
      '- go to /login',
      '2. click "Sign in"',
      '* expect url to contain "/home"',
    ].join('\n'),
  );

  assert.equal(spec.title, 'Successful login');
  assert.equal(spec.url, '/login');
  assert.equal(spec.description, 'signs in');
  assert.deepEqual(spec.tags, ['@smoke', '@auth']);
  assert.deepEqual(spec.steps, ['go to /login', 'click "Sign in"', 'expect url to contain "/home"']);
});

test('explicit title and url override the spec headers', () => {
  const spec = parseSpec('Test: From file\nURL: /a\n- click "Go"', { title: 'From flag', url: '/b' });
  assert.equal(spec.title, 'From flag');
  assert.equal(spec.url, '/b');
});

test('a spec with no Test: header still gets a title', () => {
  const spec = parseSpec('- go to /login');
  assert.equal(spec.title, 'go to /login');
});

test('slugify produces a safe filename stem', () => {
  assert.equal(slugify('Successful login @smoke'), 'successful-login-smoke');
  assert.equal(slugify('!!!'), 'generated');
});

test('renderSpec emits a valid, runnable spec file', () => {
  const spec = parseSpec('Test: Login\nURL: /login\nTags: @smoke\n- click "Sign in"');
  const { statements } = compileSteps(spec.steps);
  const file = renderSpec(spec, statements, { engine: 'offline', source: 'x.txt' });

  assert.match(file, /^\/\/ Generated test/);
  assert.match(file, /import \{ test, expect \} from '@playwright\/test';/);
  assert.match(file, /test\('Login @smoke', async \(\{ page \}\) => \{/);
  assert.equal(checkSyntax(file), null);
});

test('renderSpec adds the navigation a spec left implicit', () => {
  const spec = parseSpec('Test: T\nURL: /login\n- click "Sign in"');
  const { statements } = compileSteps(spec.steps);
  assert.match(renderSpec(spec, statements, { engine: 'offline' }), /await page\.goto\('\/login'\);/);
});

test('renderSpec does not duplicate an explicit goto', () => {
  const spec = parseSpec('Test: T\nURL: /login\n- go to /login\n- click "Sign in"');
  const { statements } = compileSteps(spec.steps);
  const file = renderSpec(spec, statements, { engine: 'offline' });
  assert.equal(file.match(/page\.goto\(/g).length, 1);
});

test('checkSyntax catches a broken file', () => {
  assert.match(checkSyntax('test( => {'), /SyntaxError/);
});

test('extractCode unwraps a fenced block', () => {
  assert.equal(extractCode('Here:\n```javascript\nconst a = 1;\n```\nDone'), 'const a = 1;\n');
  assert.equal(extractCode('const a = 1;'), 'const a = 1;\n');
  assert.equal(extractCode('   '), '');
});
