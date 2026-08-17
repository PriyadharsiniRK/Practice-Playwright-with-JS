# Practice-Playwright-with-JS

Playwright (JavaScript) test automation practice project.

## Test: Search YouTube via Google and play a video result

Automated from the manual test case `Youtube_Test.docx`:

1. Type `youtube.com` in the Google search bar and press Enter.
2. Search YouTube for `playwright with javascript` and press Enter.
3. Select and open the second listed video.
4. Verify the video is playing.

Spec file: [`tests/youtube-search.spec.js`](tests/youtube-search.spec.js)

## Setup

```bash
npm install
npx playwright install chromium   # first time only, downloads the browser
```

## Run the test

```bash
npm test              # headless run
npm run test:headed   # watch it run in a visible browser
```

Each run records a screenshot, a video, and (on retry) a trace for the test,
plus step screenshots attached at each of the four manual steps above.

## View the HTML report (with screenshots & video)

```bash
npm run report
```

This opens `playwright-report/index.html`. Open the test to see:
- the 4 test steps,
- attached screenshots for each step,
- the full-run video recording,
- the trace (on retry), viewable with the built-in trace viewer.

Report and raw artifacts are written to `playwright-report/` and
`test-results/` (both git-ignored).
