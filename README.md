# Manual Test Case → Playwright Automation Generator

Turn a manual test case written in **Excel or Word** into an executable
**Playwright** test — parsed, understood, normalised, generated, executed and
reported, without anyone writing automation code.

Ships with two applications under test: **YouTube** (search and playback) and
**OrangeHRM** (login-gated HR app).

```
Manual Test Case  →  Parse  →  Understand  →  Normalise  →  Generate  →  Execute  →  Report
   (.xlsx/.docx)                  (LLM)      (canonical)   (.spec.js)  (Playwright)  (HTML)
```

```console
$ npm run generate-and-test -- TC-YT-001

Reading test case TC-YT-001...
✓ XLSX parsed (input/youtube-tests.xlsx)
✓ Test case identified: TC-YT-001
✓ 6 manual steps detected in TC-YT-001

Analyzing steps... (analyzer: anthropic:claude-opus-5)
✓ Step 1 -> NAVIGATE  url = https://www.youtube.com
✓ Step 2 -> FILL  target = youtube.searchBox [role], value = Playwright automation
✓ Step 3 -> CLICK  target = youtube.searchButton [role]
✓ Step 4 -> ASSERT_VISIBLE  target = youtube.searchResults [css]
✓ Step 5 -> CLICK  target = youtube.firstSearchResult [css]
✓ Step 6 -> ASSERT_URL  value = /watch

Generating Playwright test...
✓ generated/TC-YT-001.spec.js

Executing test...
✓ TC-YT-001 passed

Report:
reports/html/index.html
```

---

## 1. Problem statement

Most QA teams already own hundreds of well written manual test cases in Excel
and Word. Automating them is a second, largely mechanical, translation job:
someone reads "Enter *Playwright automation* in the search box" and types
`page.getByRole('combobox', { name: /search/i }).fill('Playwright automation')`.

That translation has two halves with very different failure modes:

* **Understanding the sentence** is genuinely ambiguous work — a job an LLM is
  good at, and a job that has no single correct answer.
* **Producing correct, robust automation code** must be exact and repeatable —
  a job an LLM is bad at, and one that a template engine does perfectly.

This project splits the two apart. The model only ever produces a small,
schema-validated JSON object. A deterministic generator turns that object into
Playwright code. **The LLM never writes a line of the test.**

---

## 2. Architecture

```
                    ┌──────────────────────┐
                    │ Manual Test Case     │
                    │ Excel / Word         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Document Parser      │   src/parser/
                    └──────────┬───────────┘
                               │  raw steps (free text)
                               ▼
                    ┌──────────────────────┐
                    │ Test Case Analyzer   │   src/analyzer/
                    │ LLM + Zod schema     │
                    └──────────┬───────────┘
                               │  structured JSON
                               ▼
                    ┌──────────────────────┐
                    │ Canonical Test Model │   src/model/
                    │ validated, typed     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Playwright Generator │   src/generator/
                    │ deterministic        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Generated Test       │   generated/*.spec.js
                    │ *.spec.js            │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Playwright Runner    │   src/executor/
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ HTML Test Report     │   reports/html/
                    └──────────────────────┘
```

### The design principle

| AI responsibility | Framework responsibility |
| --- | --- |
| Understand human language | Validate the schema |
| Identify intent | Resolve the selector strategy |
| Identify the action | Generate Playwright code |
| Identify the target | Execute the test |
| Identify value / expected result | Produce the report |

Everything on the left is probabilistic and reviewable as JSON. Everything on
the right is deterministic: the same canonical test case always produces
byte-identical code, so generated specs diff cleanly in version control.

---

## 3. Technology stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 18+, JavaScript (ES modules) |
| Browser automation | Playwright (`@playwright/test`) |
| Excel parsing | ExcelJS |
| Word parsing | Mammoth |
| Schema validation | Zod |
| Language understanding | Anthropic Messages API (`claude-opus-5`) with structured outputs |
| Reporting | Playwright HTML reporter |
| Framework unit tests | `node:test` |

---

## 4. Project layout

```
playwright-test-generator/
├── src/
│   ├── parser/
│   │   ├── excelParser.js        # .xlsx → raw test cases
│   │   ├── wordParser.js         # .docx → raw test cases
│   │   └── index.js              # format dispatch + test case selection
│   ├── analyzer/
│   │   ├── testCaseAnalyzer.js   # orchestration + Zod validation
│   │   ├── llmProvider.js        # Anthropic structured-output interpreter
│   │   ├── heuristicProvider.js  # offline rule-based interpreter
│   │   └── prompt.js             # system prompt + per-step prompt
│   ├── model/
│   │   └── testCaseSchema.js     # the canonical model (single source of truth)
│   ├── generator/
│   │   ├── playwrightGenerator.js# canonical model → .spec.js
│   │   ├── selectorStrategy.js   # selector priority, application-scoped
│   │   └── applications/         # one file per app under test
│   │       ├── index.js          #   registry + hostname resolution
│   │       ├── youtube.js
│   │       └── orangehrm.js
│   ├── executor/
│   │   └── testExecutor.js       # runs Playwright, returns the exit code
│   ├── util/logger.js
│   └── cli.js
├── input/
│   ├── youtube-tests.xlsx        # sample manual test cases
│   ├── youtube-tests.docx
│   ├── orangehrm-tests.xlsx
│   ├── sample-tests.xlsx
│   └── orangehrm-tests.docx
├── generated/                    # generated specs (committed, never hand edited)
├── tests/                        # unit tests for the framework itself
├── mock/
│   ├── server.js                 # offline stand-in for youtube.com
│   └── orangehrm.js              # offline stand-in for the OrangeHRM demo
├── scripts/build-input-files.js  # regenerates the sample documents
├── reports/                      # Playwright HTML report + traces
├── playwright.config.js
└── package.json
```

---

## 5. Installation

```bash
git clone https://github.com/PriyadharsiniRK/Practice-Playwright-with-JS.git
cd Practice-Playwright-with-JS

npm install
npm run install:browsers   # not `npx playwright install` - see below

# Optional - enables the LLM analyzer. Without it the offline analyzer is used.
cp .env.example .env   # then set ANTHROPIC_API_KEY
```

`.env` is read on startup (by Node itself - no dotenv dependency) and also
holds the optional `PW_CHANNEL` and `PW_VIDEO` settings described below.

Try it immediately, no API key and no internet required:

```bash
npm run demo
```

> **Use `npm run install:browsers`, not `npx playwright install`.** Playwright
> pins each release to an exact browser revision, and `npx` resolves whichever
> Playwright version *it* finds - which may not be this project's. The npm script
> always uses the project's own Playwright, so the revisions match.
>
> The suite runs the **full Chromium build** (`channel: 'chromium'` in
> `playwright.config.js`) rather than the separate `chromium-headless-shell`
> download. That is deliberate: it needs one browser artifact instead of two, so
> a partial install can no longer leave every test failing in milliseconds with
> `Executable doesn't exist at ...chromium_headless_shell-NNNN...`.

### If the browser download will not complete

On some machines `playwright install` reports the transfer as finished but no
`chrome.exe` ever lands on disk - a proxy that returns the archive body
incompletely, or an antivirus that removes the extracted binary. The symptom is
every test failing in milliseconds with:

```
browserType.launch: Executable doesn't exist at ...\chromium-NNNN\chrome-win\chrome.exe
```

Set `PW_CHANNEL` to use a browser that is **already installed on the machine**,
which needs no `playwright install` at all:

```bash
PW_CHANNEL=chrome npm run demo             # macOS / Linux
$env:PW_CHANNEL = "chrome"; npm run demo   # Windows PowerShell
```

A shell variable only lives in that one terminal. To make the setting stick,
put it in `.env` at the project root instead - the CLI and `playwright.config.js`
both read that file on startup:

```
PW_CHANNEL=chrome
```

Anything already set in the environment still wins, so `.env` is a default you
can override per run rather than a lock.

`chrome` and `msedge` are both accepted. Everything else - selectors, actions,
assertions, the report - is unchanged; only the browser binary differs.

Video capture is off by default for the same reason: it is the one artifact that
needs Playwright's **ffmpeg** binary, which ships with the browser download, so
on such a machine every test would otherwise fail at `browserContext.newPage`
before running a step. Traces and screenshots need no extra binary and stay on,
so the HTML report still explains every failure. Set `PW_VIDEO=1` to record
video too.

---

## 6. Input format

### Excel

One header row, then **one row per manual step**. Rows sharing a `TestCaseID`
are grouped into a single test case, in sheet order. Only the first worksheet
is read.

| TestCaseID | Title | Preconditions | Step | ExpectedResult |
| --- | --- | --- | --- | --- |
| TC-YT-001 | Search YouTube | Internet available | Open https://www.youtube.com | YouTube homepage displayed |
| TC-YT-001 | Search YouTube | Internet available | Enter "Playwright automation" in the search box | Search text entered |
| TC-YT-001 | Search YouTube | Internet available | Click the Search button | Search results displayed |
| TC-YT-001 | Search YouTube | Internet available | Click the first search result | Video page displayed |

`TestCaseID`, `Title` and `Step` are required; `Preconditions` and
`ExpectedResult` are optional. Column headers are matched case- and
spacing-insensitively, and a few aliases are accepted (`ID`, `Action`,
`Expected`, …).

### Word

One block per test case:

```
Test Case ID: TC-YT-001
Title: Search for a video on YouTube
Precondition: User has internet access.
Steps:
1. Open https://www.youtube.com
Expected: YouTube homepage is displayed
2. Enter "Playwright automation" in the search box
3. Click the Search button
```

`Expected:` lines attach to the step above them. Any line that does not match
one of these prefixes is ignored, so headings and blank lines are harmless.

Both sample documents are committed under `input/` and can be regenerated with
`npm run build:inputs`.

> Supporting arbitrary spreadsheet and document layouts is an explicit
> non-goal. The formats above are the contract.

---

## 7. Canonical test model

```js
Action =
  | 'NAVIGATE' | 'GO_BACK' | 'CLICK' | 'FILL' | 'PRESS' | 'SELECT'
  | 'ASSERT_VISIBLE' | 'ASSERT_HIDDEN' | 'ASSERT_TEXT' | 'ASSERT_URL' | 'ASSERT_TITLE'

TestStep {
  stepNumber: number
  originalText: string        // the manual sentence, kept for traceability
  action: Action
  target?: {
    description: string       // "YouTube search box"
    role?: string             // "combobox"
    name?: string             // "Search"
    locator?: string          // author escape hatch, lowest priority
  }
  value?: string
  expected?: string
}

TestCase {
  id: string
  title: string
  preconditions?: string[]
  steps: TestStep[]
}
```

Defined in `src/model/testCaseSchema.js` as Zod schemas. Nothing downstream of
this model ever sees free text it has to interpret.

`npm run analyze -- TC-YT-001` prints the canonical model, which is the most
useful thing to look at when a generated test is not what you expected.

---

## 8. Test case understanding

The analyzer asks the model about **one step at a time**, with the rest of the
test case supplied only as context. It requests a fixed JSON shape via the
Messages API's structured outputs, so the response is schema-constrained at
decode time:

```
Test Case:
Search for a video on YouTube

Step:
2. Enter "Playwright automation" in the search box
```

```json
{
  "stepNumber": 2,
  "originalText": "Enter \"Playwright automation\" in the search box",
  "action": "FILL",
  "target": { "description": "YouTube search box", "role": "combobox", "name": "Search" },
  "value": "Playwright automation"
}
```

The response is then validated with Zod on our side as well. If validation
fails, the analyzer makes **one controlled repair attempt**, handing the model
the validation error, and re-validates. A second failure raises
`INVALID_LLM_RESPONSE` with the offending payload rather than guessing.

### Two analyzers, one contract

| Provider | Used when | Notes |
| --- | --- | --- |
| `anthropic:claude-opus-5` | `ANTHROPIC_API_KEY` is set | Handles free-form wording |
| `heuristic` | no key, or `--provider heuristic` | Deterministic rules, no network, no spend |

Both emit the identical structure and pass through the identical validation, so
every later stage is unchanged. The provider in use is printed by the CLI and
recorded in the header of every generated spec — the framework never silently
swaps one for the other.

---

## 9. Selector strategy

The model is explicitly forbidden from producing selectors. It describes the
element; the framework decides how to find it, in this priority order:

```
1. getByRole()          ← preferred
2. getByLabel()
3. getByPlaceholder()
4. getByText()
5. locator()            ← CSS, last resort
```

Each test case is bound to **one application**, chosen from the hostname of its
first navigation step. That keeps element vocabularies from colliding: "search
box" means YouTube's masthead combobox in one test case and OrangeHRM's sidebar
filter in another, and the framework never has to guess which.

Resolution happens in `src/generator/selectorStrategy.js`:

1. **Application catalog** — well-known elements of the app under test are
   pinned to a curated locator. When several entries match, the most specific
   wording wins (`first search result` beats `search results`); a genuine tie
   raises `AMBIGUOUS_TARGET`.
2. **Analyzer role + name** — `getByRole(role, { name })` for anything not in
   the catalog.
3. **Author-supplied `locator`** — the deliberate escape hatch.
4. Otherwise `TARGET_NOT_UNDERSTOOD`, listing the elements it does know.

So this:

```js
page.getByRole('button', { name: /search/i })
```

is always preferred over this:

```js
page.locator('#some-random-id')
```

---

## 10. Example: manual test in, Playwright test out

**Manual test case (Excel row group)**

```
Test Case ID: TC-YT-001
Title:        Search for a video on YouTube
Precondition: User has internet access.

1. Open https://www.youtube.com
2. Enter "Playwright automation" in the search box
3. Click the Search button
4. Verify that search results are displayed
5. Click the first search result
6. Verify that the video page is displayed
```

**Normalised steps**

```
1. NAVIGATE        url = https://www.youtube.com
2. FILL            target = search input, value = Playwright automation
3. CLICK           target = Search button
4. ASSERT_VISIBLE  target = search results
5. CLICK           target = first search result
6. ASSERT_URL      expected = /watch
```

**Generated `generated/TC-YT-001.spec.js`**

```js
// ---------------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
// Produced by playwright-test-generator from a manual test case.
//   test case : TC-YT-001
//   source    : input/youtube-tests.xlsx
//   analyzer  : heuristic
// Re-run `npm run generate` after editing the manual test case.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test('TC-YT-001 - Search for a video on YouTube', async ({ page }) => {
  // Precondition: User has internet access.

  // Step 1: Open https://www.youtube.com
  await page.goto('https://www.youtube.com');

  // Step 2: Enter "Playwright automation" in the search box
  await page.getByRole('combobox', { name: /search/i }).fill('Playwright automation');

  // Step 3: Click the Search button
  await page.getByRole('button', { name: /^search$/i }).click();

  // Step 4: Verify that search results are displayed
  await expect(page.locator('ytd-search')).toBeVisible();

  // Step 5: Click the first search result
  await page.locator('ytd-video-renderer').first().click();

  // Step 6: Verify that the video page is displayed
  await expect(page).toHaveURL(/\/watch/i);
});
```

Each generated statement carries the manual sentence it came from, so a
failing line in CI points straight back at a line in the manual test case.

> The committed specs were generated with the offline analyzer, which is why
> their header reads `heuristic`. Regenerating with `ANTHROPIC_API_KEY` set
> produces the same code with `anthropic:claude-opus-5` in the header.

---

## 11. A second application: OrangeHRM

The same pipeline, the same input format, a different site. Nothing in
`src/parser/`, `src/model/`, `src/generator/playwrightGenerator.js` or
`src/executor/` knows which application it is working on.

**Manual test case** (`input/orangehrm-tests.xlsx`)

```
Test Case ID: TC-OHRM-002
Title:        Reject invalid credentials

1. Open https://opensource-demo.orangehrmlive.com
2. Enter "Admin" in the Username field
3. Enter "wrong-password" in the Password field
4. Click the Login button
5. Verify that the login error message is visible
6. Verify that the URL contains "/auth/login"
```

**Generated `generated/TC-OHRM-002.spec.js`**

```js
await page.goto('https://opensource-demo.orangehrmlive.com');
await page.getByPlaceholder(/username/i).fill('Admin');
await page.getByPlaceholder(/password/i).fill('wrong-password');
await page.getByRole('button', { name: /^\s*login\s*$/i }).click();
await expect(page.getByText(/invalid credentials/i)).toBeVisible();
await expect(page).toHaveURL(/\/auth\/login/i);
```

OrangeHRM's inputs carry a placeholder but no label or accessible name, and its
login failure is a text banner — so it reaches the `getByPlaceholder()` and
`getByText()` tiers of the selector strategy that a search-only site never
touches. Between the applications, **all five tiers and every canonical
action** are exercised.

### SauceDemo, and what a third application taught the framework

`input/sample-tests.xlsx` covers [saucedemo.com](https://www.saucedemo.com):
login, cart, sorting and checkout. Its manual test cases are written in a style
the first two documents never used, and each difference became a rule:

| The document does this | The framework learned to |
| --- | --- |
| Names no URL anywhere — just "User is on SauceDemo login page" | Bind by the application name the prose uses, and let a test case that names nothing inherit its document's application |
| Writes `Enter username standard_user` — no quotes | Let an application declare its own unquoted wording (`dataEntry`) |
| Writes `Enter first name` — no value at all | Take the value from the application's declared test data, rather than inventing one in the analyzer |
| States setup as a precondition (`User is logged in`) and writes no step for it | Emit a `Setup:` block that performs it, unless the test case navigates for itself |
| Says `Open shopping cart` | Treat "open" with no address as a click, not a navigation |
| Says `Verify backpack is not displayed` | Assert absence (`ASSERT_HIDDEN`), not presence |
| Says `Verify Products heading` and puts the check in the ExpectedResult column | Read the ExpectedResult column as part of the step |
| Says `Select Price low to high` | Emit `selectOption()` (`SELECT`), not a click |

None of that is site-specific logic in the pipeline: the rules are generic, and
what they mean for SauceDemo is declared in `src/generator/applications/saucedemo.js`.

### Adding a fourth application

Write one file under `src/generator/applications/` and register it:

```js
export const myapp = {
  id: 'myapp',
  name: 'My App',
  hosts: [/(^|\.)myapp\.com$/i],
  baseUrl: 'https://myapp.com',
  offlinePort: 4176,
  targets: [ /* description -> locator */ ],
  assertionHints: [ /* "the basket is displayed" -> ASSERT_URL /basket */ ],
  // Optional, for documents written like SauceDemo's:
  nameHints: [ /* bind by name when no step carries a URL */ ],
  dataEntry: [ /* wording for values that are not in quotes */ ],
  stepHints: [ /* wording whose verb does not name its action */ ],
  preconditionHints: [ /* what "user is logged in" means in actions */ ],
};
```

No pipeline code changes. The application is picked automatically from the URL
in step 1 of the manual test case, or from the name its prose uses.

---

## 12. Commands

```bash
npm run parse             -- TC-YT-001     # document → raw steps (JSON)
npm run analyze           -- TC-YT-001     # raw steps → canonical model (JSON)
npm run generate          -- TC-YT-001     # canonical model → generated/*.spec.js
npm test                                   # run every generated spec
npm run generate-and-test -- TC-YT-001     # the whole pipeline
npm run report                             # open the HTML report
npm run demo                               # full pipeline, offline (YouTube)
npm run demo:orangehrm                     # full pipeline, offline (OrangeHRM)
npm run demo:saucedemo                     # full pipeline, offline (SauceDemo)
npm run test:unit                          # unit tests for the framework
npm run build:inputs                       # regenerate the sample documents
npm run install:browsers                   # download the matching Chromium
```

Every manual step becomes a named `test.step()` in the generated spec, and each
one attaches a screenshot of the page as it stood when that step finished. The
report therefore lists your manual wording verbatim - `Step 4: Click the Login
button` - with the matching picture underneath, so a manual tester can check
what the automation actually did without reading any code. Generate with
`--no-screenshots` to leave the attachments out.

### Two reports

Every run writes both:

| File | How to open | What it is for |
| --- | --- | --- |
| `reports/step-report.html` | double-click it | Cross-checking. One card per manual step: the wording from your document, what the framework did, PASS/FAIL, and the screenshot. Images are embedded, so it is a single self-contained file - no server, and you can email it. |
| `reports/html/index.html` | `npm run report` | Debugging. Playwright's own report, with traces, timings and the full error context. |

On a failing step the card shows the error and Playwright's failure screenshot,
labelled as such - a step that fails never reaches its own screenshot call.

The report is served over HTTP, not opened from disk - the reporter writes
`index.html` plus a `data/` directory that the page fetches at runtime, and
those fetches are blocked under `file://`, so double-clicking `index.html`
gives a blank report. `npm run report` keeps serving until you press Ctrl+C;
leave it running and open the URL it prints in another window.

Omit the test case id to process every test case in the document.

| Option | Meaning |
| --- | --- |
| `-i, --input <file>` | manual test case document (default `input/youtube-tests.xlsx`) |
| `-o, --out <dir>` | where to write generated specs (default `generated/`) |
| `-p, --provider <mode>` | `auto` (default), `llm`, or `heuristic` |
| `--offline` | generate and run against the bundled local stand-in |
| `--headed` | run the browser headed |
| `--no-screenshots` | omit the per-step screenshots from the generated specs |

### Reading the Word document instead

```bash
npm run generate-and-test -- TC-YT-003 --input input/youtube-tests.docx
```

### Running the OrangeHRM cases

```bash
npm run generate-and-test -- --input input/orangehrm-tests.xlsx
npm run generate-and-test -- --input input/orangehrm-tests.docx
```

---

## 13. Adding a new test case — the point of the whole thing

Add rows to the spreadsheet. That is the entire workflow.

| TestCaseID | Title | Preconditions | Step | ExpectedResult |
| --- | --- | --- | --- | --- |
| TC-YT-005 | Search using the keyboard only | Internet available | Open https://www.youtube.com | Homepage shown |
| TC-YT-005 | Search using the keyboard only | Internet available | Enter "Playwright trace viewer" in the search box | Text entered |
| TC-YT-005 | Search using the keyboard only | Internet available | Press Enter | Search submitted |
| TC-YT-005 | Search using the keyboard only | Internet available | Verify that search results are displayed | Results shown |
| TC-YT-005 | Search using the keyboard only | Internet available | Verify that the page title contains "Playwright" | Tab shows the query |

```bash
npm run generate-and-test -- TC-YT-005
```

```
✓ Step 1 -> NAVIGATE  url = https://www.youtube.com
✓ Step 2 -> FILL  target = youtube.searchBox [role], value = Playwright trace viewer
✓ Step 3 -> PRESS  value = Enter
✓ Step 4 -> ASSERT_VISIBLE  target = youtube.searchResults [css]
✓ Step 5 -> ASSERT_TITLE  value = Playwright
✓ generated/TC-YT-005.spec.js
✓ TC-YT-005 passed
```

**No framework file was edited.** A new UI element that the catalog has never
seen is a one-line data entry in `TARGET_CATALOG`; a new test case over
existing elements needs nothing at all.

---

## 14. Error handling

The pipeline refuses to produce automation it cannot stand behind. Every
failure carries a stable code and a non-zero exit status.

| Code | Raised when |
| --- | --- |
| `INVALID_TEST_CASE` | the document is malformed, or the requested id does not exist |
| `UNSUPPORTED_ACTION` | a step cannot be expressed with the supported actions |
| `TARGET_NOT_UNDERSTOOD` | no locator can be resolved for the element |
| `AMBIGUOUS_TARGET` | the description matches several known elements equally well |
| `INVALID_LLM_RESPONSE` | the model's output fails schema validation twice |
| `GENERATION_FAILED` | the canonical model is internally inconsistent |
| `TEST_EXECUTION_FAILED` | Playwright could not be started |

```console
$ npm run generate -- TC-YT-099

✓ Step 1 -> NAVIGATE  url = https://www.youtube.com

✗ UNSUPPORTED_ACTION: Unsupported assertion.

Step 2:
"Verify that recommended videos are relevant"

The framework currently supports:
- visible
- text
- URL
- title
```

```console
✗ TARGET_NOT_UNDERSTOOD: Could not resolve a locator for "subscribe button".

Known elements for this application:
- YouTube search box
- YouTube search button
- YouTube search results list
- first YouTube search result
- YouTube video player
- YouTube logo
- video title heading on the watch page

Reword the manual step to refer to one of them, or add the element to
TARGET_CATALOG in src/generator/selectorStrategy.js.
```

A half-understood step never becomes a half-correct test.

---

## 15. Test report

`npm test` writes a Playwright HTML report to `reports/html/`; open it with
`npm run report`.

![Playwright HTML report showing ten generated test cases passing across YouTube and OrangeHRM](docs/playwright-html-report.png)

Traces, screenshots and video are retained on failure under
`reports/artifacts/`, so a failed generated test is debuggable exactly like a
hand-written one.

---

## 16. Offline mode

`--offline` points the generated tests at the bundled stand-ins — `mock/server.js`
for YouTube (port 4173) and `mock/orangehrm.js` for OrangeHRM (port 4174), each
a small server reproducing only the accessibility hooks the tests use — the "Search"
combobox and button, `ytd-search`, `ytd-video-renderer`, the "YouTube Home"
logo link and `#movie_player`.

It exists so the whole pipeline can be demonstrated and run in CI without
depending on youtube.com being reachable, and without a test suite repeatedly
hitting a third-party site. **Only the origin in `page.goto()` differs** — every
selector, action and assertion in the generated code is identical to the code
that runs against the real site.

---

## 17. Design decisions

* **The LLM never emits code.** It fills in a small JSON object; a template
  engine produces the Playwright source. This is the single decision the whole
  project is built around — it makes output reviewable, diffable and
  reproducible, and it caps the blast radius of a bad model response at "one
  step was misclassified" rather than "the test does something unexpected".
* **A canonical model in the middle.** Parsers, analyzers and generators only
  ever talk to `TestCase`. Adding a PDF parser or a Cypress generator means
  writing one module, not touching the pipeline.
* **Zod at every boundary**, including between our own stages. A schema error
  points at a field, not at a stack trace.
* **Selectors are framework property, not model output.** The catalog plus a
  role/name fallback keeps generated tests readable and robust, and makes a
  brittle selector a one-line fix in one place rather than a find-and-replace
  across generated files.
* **One step per model call.** Smaller prompts, cheaper repairs, and a failure
  isolated to the step that caused it.
* **The offline analyzer is a peer, not a silent fallback.** It always announces
  itself and is recorded in the generated file header.
* **Generated specs are committed.** The diff of a regenerated suite is the
  clearest possible review of a change to a manual test case.

---

## 18. Limitations

* Scope is a deliberately small slice of each application: search and playback
  on YouTube; login, the dashboard and the PIM menu on OrangeHRM.
* Nine canonical actions and four assertion kinds. Anything else is refused
  rather than approximated.
* One header-row Excel layout and one Word layout. No merged cells, no
  multi-sheet workbooks, no tables inside Word.
* Elements outside `TARGET_CATALOG` rely on the analyzer inferring a usable
  role and accessible name.
* Steps are interpreted independently; there is no cross-step state beyond the
  test case title supplied as context.
* Against the live site, YouTube's consent dialogs, A/B tested markup and
  locale differences can affect the curated selectors — the offline mode exists
  partly because of this.
* No login, no cookies, no test data management.

---

## 19. Future enhancements

Not implemented, and deliberately so:

* Jira / Xray and Azure DevOps integration
* PDF test cases
* Requirement-to-test generation
* Automatic locator discovery and self-healing selectors
* Test data generation
* Combined API + UI tests
* Test case deduplication and coverage analysis
* Page Object Model generation
* CI/CD integration and a test execution dashboard
* Human approval gate before generated tests are executed

---

## 20. Licence

MIT — see [LICENSE](LICENSE).
