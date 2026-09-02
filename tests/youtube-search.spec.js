// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Automation Test:
 * 1. Type youtube.com in google search bar and enter
 * 2. Then search with "playwright with javascript" and enter
 * 3. Select and open second listed video
 * 4. Should able to see whether video is playing
 */
test('Search YouTube via Google and play a video result', async ({ page }, testInfo) => {
  await test.step('Type youtube.com in google search bar and enter', async () => {
    await page.goto('/');

    const consentButton = page.getByRole('button', { name: /accept all|i agree/i });
    if (await consentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await consentButton.click();
    }

    const searchBox = page.locator('textarea[name="q"], input[name="q"]').first();
    await searchBox.click();
    await searchBox.fill('youtube.com');
    await searchBox.press('Enter');

    // Google's consent flow sometimes redirects to a separate consent page
    // after submitting a search rather than before, and shared/datacenter
    // IPs (like CI runners) can trigger an interstitial "unusual traffic"
    // check. Handle both before falling back to the normal results wait.
    await page.waitForLoadState('domcontentloaded');
    const postSearchConsent = page.getByRole('button', { name: /accept all|i agree/i });
    if (await postSearchConsent.isVisible({ timeout: 3000 }).catch(() => false)) {
      await postSearchConsent.click();
    }

    const unusualTraffic = page.getByText(/unusual traffic|not a robot/i);
    if (await unusualTraffic.isVisible({ timeout: 3000 }).catch(() => false)) {
      throw new Error(
        'Google served an "unusual traffic" / CAPTCHA interstitial instead of search results. ' +
          'This happens when the request comes from a shared/datacenter IP (e.g. CI runners) that ' +
          'Google flags as automated - it is not a locator or app bug.'
      );
    }

    // Google's results container id has varied ("#search", "#rso", "#rcnt")
    // across experiments, so accept any of them instead of a single id.
    await page.locator('#search, #rso, #rcnt').first().waitFor({ state: 'visible', timeout: 20000 });
    await testInfo.attach('01-google-search-results', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    const youtubeResultLink = page.locator('a[href^="https://www.youtube.com/"]').first();
    await expect(youtubeResultLink).toBeVisible();
    await youtubeResultLink.click();

    await page.waitForURL(/youtube\.com/);
    await expect(page).toHaveURL(/youtube\.com/);
  });

  await test.step('Search with "playwright with javascript" and enter', async () => {
    const ytConsentButton = page.getByRole('button', { name: /accept all|i agree/i });
    if (await ytConsentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ytConsentButton.click();
    }

    const ytSearchBox = page.locator('input#search, input[name="search_query"]').first();
    await ytSearchBox.click();
    await ytSearchBox.fill('playwright with javascript');
    await ytSearchBox.press('Enter');

    await page.waitForSelector('ytd-video-renderer');
    await testInfo.attach('02-youtube-search-results', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  await test.step('Select and open second listed video', async () => {
    const videoResults = page.locator('ytd-video-renderer');
    await expect(videoResults.nth(1)).toBeVisible();

    const secondVideoTitle = videoResults.nth(1).locator('#video-title');
    const videoTitleText = await secondVideoTitle.innerText();
    testInfo.annotations.push({ type: 'selected-video', description: videoTitleText });

    await secondVideoTitle.click();
    await page.waitForURL(/watch\?v=/);
    await expect(page).toHaveURL(/watch\?v=/);
  });

  await test.step('Should able to see whether video is playing', async () => {
    const videoPlayer = page.locator('video.html5-main-video').first();
    await expect(videoPlayer).toBeVisible({ timeout: 15000 });

    // Autoplay may take a moment to kick in; nudge play in case it's paused.
    await videoPlayer.evaluate((video) => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    });

    await expect
      .poll(async () => videoPlayer.evaluate((video) => video.paused), {
        message: 'Expected the YouTube video to be playing (not paused)',
        timeout: 15000,
      })
      .toBe(false);

    await testInfo.attach('03-video-playing', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});
