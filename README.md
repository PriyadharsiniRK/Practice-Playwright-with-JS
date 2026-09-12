# Practice-Playwright-with-JS

A Playwright (JavaScript) practice repo with **ai-testgen**: a small generator that
turns a plain-English test description into a runnable Playwright spec file.

```
examples/login.spec.txt  ──▶  generator  ──▶  tests/successful-login.spec.js
   (plain English)              (AI or                  (Playwright)
                                offline)
```

## Quick start

```bash
npm install
npx playwright install chromium        # first run only

# Generate from an example spec, without calling any API:
npm run gen -- --spec examples/login.spec.txt --offline --dry-run

# Generate with Claude (needs ANTHROPIC_API_KEY):
npm run gen -- --spec examples/login.spec.txt

# Run the generated tests:
BASE_URL=https://your-app.example.com npx playwright test
```

## Two engines, one output

| Engine | When | What it does |
| --- | --- | --- |
| **AI** (default) | `ANTHROPIC_API_KEY` is set | Sends the spec to Claude with a Playwright style guide and returns the file it writes. Handles free-form prose. |
| **Offline** | `--offline`, or automatically when no key is found | Translates each step with a built-in grammar. Deterministic, no network, no cost — but only understands the vocabulary below. |

Either way the output is syntax-checked with `node --check` before it is written,
and every generated file is a starting point to review, not a finished test.

## Writing a spec

Headers are optional; anything else is a step.

```
Test: Successful login
URL: /login
Tags: @smoke @auth
Description: A valid user signs in and lands on the dashboard.

Steps:
- go to /login
- fill "Email" with "user@example.com"
- click the "Sign in" button
- expect url to contain "/dashboard"
- expect the "Welcome back" heading to be visible
```

### Offline vocabulary

**Navigate** — `go to <url>` · `visit <url>` · `reload` · `go back` · `go forward`

**Interact** — `click "X"` · `click the "X" link` · `double-click "X"` · `hover over "X"` ·
`fill "Label" with "value"` · `type "value" into "Label"` · `select "Option" from "Label"` ·
`check "X"` · `uncheck "X"` · `press "Enter" key` · `upload "file.png" to "Label"` · `screenshot`

**Assert** — `expect url to contain "X"` · `expect url to be "X"` · `expect title to be "X"` ·
`expect "X" to be visible` · `expect "X" to be hidden` · `expect "X" to be disabled` ·
`expect "X" to have value "V"` · `expect "X" to have count 3` · `expect "X" to contain text "V"`

**Targeting** — a trailing role noun picks the locator (`click the "Save" button` →
`getByRole('button', …)`). Supported roles: button, link, heading, checkbox, radio, tab,
menuitem, textbox, combobox, option, listitem, alert. For anything else, prefix the target:

| Prefix | Produces |
| --- | --- |
| `testid:submit` | `page.getByTestId('submit')` |
| `css:.cart-row` | `page.locator('.cart-row')` |
| `text:Sold out` | `page.getByText('Sold out')` |
| `label:Email` | `page.getByLabel('Email')` |
| `placeholder:Search` | `page.getByPlaceholder('Search')` |

An unrecognised step becomes a `// TODO:` comment and a warning — it is never dropped
silently. Steps asking for a fixed wait are refused on purpose: use a web-first
assertion (`expect "X" to be visible`) instead of a timeout.

## CLI

```
npm run gen -- [options]

  --spec <file>     Spec file to read (see examples/).
  --prompt <text>   Inline spec; one step per line, or separated by ";" / "then".
  --url <url>       Starting URL, overriding the spec's URL: header.
  --name <title>    Test title, overriding the spec's Test: header.
  --out <file>      Output path (default: tests/<slug>.spec.js).
  --offline         Use the built-in grammar instead of calling the API.
  --model <id>      Model for the AI engine (default: claude-opus-5).
  --dry-run         Print the generated file instead of writing it.
  --force           Overwrite an existing output file.
  -h, --help        Show help.
```

## AI engine notes

- Model: `claude-opus-5` with adaptive thinking, streamed so long responses don't time out.
- Requests opt into server-side **refusal fallbacks**, so a request declined by a policy
  classifier is retried on a fallback model inside the same call. If your account or SDK
  build doesn't have that beta, the generator notices, warns, and retries without it.
- Credentials come from `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`). With no
  credentials the CLI warns and switches to the offline engine rather than failing.

## Layout

```
generator/
  cli.js              argument parsing, engine selection, syntax check, file output
  parse-spec.js       plain-English spec -> {title, url, tags, steps}
  offline-engine.js   the deterministic step -> Playwright grammar
  ai-engine.js        the Claude call
  prompt.js           system prompt (the Playwright style guide)
  render.js           statements -> a complete spec file
  tests/              unit tests (node:test)
examples/             sample specs
tests/                generated Playwright specs
playwright.config.js  baseURL comes from BASE_URL
```

## Tests

```bash
npm run test:unit     # generator unit tests, no browser or network needed
npm test              # Playwright tests in tests/
```

`tests/add-a-todo-item.spec.js` was generated from `examples/todomvc.spec.txt` and runs
against the public Playwright TodoMVC demo, so it needs no local app.
