// Generated test — review it before trusting it. Locators are guesses until they run green.
// Engine: offline
// Source spec: examples/todomvc.spec.txt
import { test, expect } from '@playwright/test';

test('Add a todo item @demo', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
  await page.getByPlaceholder('What needs to be done?').fill('buy milk');
  await page.keyboard.press('Enter');
  await expect(page.getByText('buy milk')).toBeVisible();
  await expect(page.locator('.todo-list li')).toHaveCount(1);
  await page.locator('.todo-list li .toggle').check();
  await expect(page.locator('.todo-list li.completed')).toHaveCount(1);
});
