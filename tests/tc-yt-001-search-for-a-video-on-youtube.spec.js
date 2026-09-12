// Generated test — review it before trusting it. Locators are guesses until they run green.
// Engine: offline
// Source spec: examples/youtube-search.spec.txt
import { test, expect } from '@playwright/test';

// A user searches for a video on YouTube using the search functionality.
test('TC-YT-001 - Search for a video on YouTube @smoke @youtube', async ({ page }) => {
  await page.goto('https://www.youtube.com');

  // Dismiss YouTube's consent/cookie dialog if it appears
  // The dialog is typically a lightbox that blocks interactions
  const consentDialog = page.locator('ytd-consent-bump-v2-lightbox').first();
  const isDialogVisible = await consentDialog.isVisible({ timeout: 5000 }).catch(() => false);

  if (isDialogVisible) {
    // Look for the accept/agree button in the consent dialog
    const agreeButton = page.locator('ytd-consent-bump-v2-lightbox button').filter({ hasText: /^(I agree|Agree|Accept)$/i }).first();
    const agreeIsVisible = await agreeButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (agreeIsVisible) {
      await agreeButton.click();
      await page.waitForTimeout(500);
    } else {
      // Alternative: click any button in the dialog
      const dialogButtons = page.locator('ytd-consent-bump-v2-lightbox button');
      const buttonCount = await dialogButtons.count();
      if (buttonCount > 0) {
        // Usually the first or last button is the accept button
        await dialogButtons.last().click();
        await page.waitForTimeout(500);
      }
    }
  }

  await page.getByLabel('Search').fill('Playwright testing');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/search_query/);
  await expect(page.getByText('Playwright testing')).toBeVisible();
});
