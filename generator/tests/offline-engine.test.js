import test from 'node:test';
import assert from 'node:assert/strict';

import { compileStep, compileSteps, locator, js, rx } from '../offline-engine.js';

const code = (step) => compileStep(step).code[0];

test('navigation steps', () => {
  assert.equal(code('go to /login'), "await page.goto('/login');");
  assert.equal(code('visit https://example.com'), "await page.goto('https://example.com');");
  assert.equal(code('reload the page'), 'await page.reload();');
  assert.equal(code('go back'), 'await page.goBack();');
});

test('click resolves a role from the sentence', () => {
  assert.equal(code('click "Sign in"'), "await page.getByRole('button', { name: 'Sign in' }).click();");
  assert.equal(code('click the "Docs" link'), "await page.getByRole('link', { name: 'Docs' }).click();");
  assert.equal(code('click on the "Save" button'), "await page.getByRole('button', { name: 'Save' }).click();");
  assert.equal(code('tap "Menu"'), "await page.getByRole('button', { name: 'Menu' }).click();");
});

test('form input steps', () => {
  assert.equal(code('fill "Email" with "a@b.com"'), "await page.getByLabel('Email').fill('a@b.com');");
  assert.equal(code('type "hello" into "Search"'), "await page.getByLabel('Search').fill('hello');");
  assert.equal(code('select "Blue" from "Colour"'), "await page.getByLabel('Colour').selectOption('Blue');");
  assert.equal(code('check "Remember me"'), "await page.getByRole('checkbox', { name: 'Remember me' }).check();");
  assert.equal(code('uncheck "Newsletter"'), "await page.getByRole('checkbox', { name: 'Newsletter' }).uncheck();");
  assert.equal(code('press "Enter" key'), "await page.keyboard.press('Enter');");
  assert.equal(code('upload "avatar.png" to "Photo"'), "await page.getByLabel('Photo').setInputFiles('avatar.png');");
});

test('assertions use web-first matchers', () => {
  assert.equal(code('expect url to contain "/dashboard"'), 'await expect(page).toHaveURL(/\\/dashboard/);');
  assert.equal(code('expect url to be "/home"'), "await expect(page).toHaveURL('/home');");
  assert.equal(code('expect title to be "Home"'), "await expect(page).toHaveTitle('Home');");
  assert.equal(code('expect "Welcome" to be visible'), "await expect(page.getByText('Welcome')).toBeVisible();");
  assert.equal(code('expect "Error" to be hidden'), "await expect(page.getByText('Error')).not.toBeVisible();");
  assert.equal(code('expect "Error" not to be visible'), "await expect(page.getByText('Error')).not.toBeVisible();");
  assert.equal(code('expect "Submit" to be disabled'), "await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();");
  assert.equal(code('expect "Email" to have value "a@b.com"'), "await expect(page.getByLabel('Email')).toHaveValue('a@b.com');");
  assert.equal(code('expect "css:.row" to have count 3'), "await expect(page.locator('.row')).toHaveCount(3);");
  assert.equal(code('expect "Cart" to contain text "2 items"'), "await expect(page.getByText('Cart')).toContainText('2 items');");
});

test('locator strategies', () => {
  assert.equal(locator('testid:submit'), "page.getByTestId('submit')");
  assert.equal(locator('css:.btn'), "page.locator('.btn')");
  assert.equal(locator('#login'), "page.locator('#login')");
  assert.equal(locator('placeholder:Search'), "page.getByPlaceholder('Search')");
  assert.equal(locator('Save button'), "page.getByRole('button', { name: 'Save' })");
  assert.equal(locator('Total', 'text'), "page.getByText('Total')");
});

test('unknown steps become TODOs, not silent drops', () => {
  const result = compileStep('do a barrel roll');
  assert.match(result.code[0], /^\/\/ TODO: unsupported step:/);
  assert.match(result.warning, /did not match any known pattern/);
});

test('hard waits are flagged rather than emitted', () => {
  const result = compileStep('wait 5 seconds');
  assert.equal(result.rule, 'unsupported-wait');
  assert.doesNotMatch(result.code[0], /waitForTimeout/);
  assert.match(result.warning, /Prefer "expect/);
});

test('string and regex values are escaped', () => {
  assert.equal(js("O'Brien"), "'O\\'Brien'");
  assert.equal(js('back\\slash'), "'back\\\\slash'");
  assert.equal(rx('a.b/c'), '/a\\.b\\/c/');
  assert.equal(code(`fill "Name" with "O'Brien"`), "await page.getByLabel('Name').fill('O\\'Brien');");
});

test('compileSteps collects statements and warnings together', () => {
  const { statements, warnings } = compileSteps(['go to /', 'do something odd', 'click "OK"']);
  assert.equal(statements.length, 3);
  assert.equal(warnings.length, 1);
});
