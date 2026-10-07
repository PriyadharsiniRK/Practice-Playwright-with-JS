# Applications under test

The [README](../README.md) uses YouTube as the main example. The same pipeline
also drives four other sites. This page explains what each one added to the
framework. Nothing in `src/parser/`, `src/model/`,
`src/generator/playwrightGenerator.js` or `src/executor/` knows which
application it is working on.

| Application | Input document | Test cases |
| --- | --- | --- |
| YouTube | `input/youtube-tests.xlsx`, `input/youtube-tests.docx` | `TC-YT-*` |
| OrangeHRM | `input/orangehrm-tests.xlsx`, `input/orangehrm-tests.docx` | `TC-OHRM-*` |
| SauceDemo | `input/sample-tests.xlsx`, `input/sample-tests.docx` | `TC-SD-*` |
| CarInfo | `input/carinfo-tests.docx`, `input/carinfo-tests.xlsx` | `TC-CI-*` |
| TNEB | `input/tneb-tests.docx`, `input/tneb-tests.xlsx`, `input/EB-tests.docx` | `TC-TNEB-*`, `TC-EB-001` |

```bash
npm run generate-and-test -- --input input/orangehrm-tests.xlsx
npm run demo:saucedemo
npm run demo:carinfo
npm run demo:tneb
```

## OrangeHRM

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

## SauceDemo, and what a third application taught the framework

`input/sample-tests.xlsx` covers [saucedemo.com](https://www.saucedemo.com):
(`input/sample-tests.docx` is the same test cases in Word, built from the
spreadsheet by `node scripts/build-saucedemo-docx.js`)
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

## CarInfo, and what a manual test case has to be before it can be automated

The fourth application arrived as a hand-written Word document, and three of its
steps could not be automated **as written**. That is more instructive than the
catalog itself, so the reasons are recorded here:

| The document said | Why it cannot be automated | What replaced it |
| --- | --- | --- |
| Sign in with Google | OAuth is built to resist automation: bot detection, device verification, markup that changes without notice. The test would be red for reasons unrelated to the application | TC-CI-003 asserts a signed-out visitor is *offered* sign-in |
| "If it further requests for access, click on Continue" | A conditional step makes the run non-deterministic, and a test that does different things on different runs cannot be asserted about | A deterministic precondition, or an explicit assertion that the dialog is absent |
| "Enter username as X and password as Y" | Two actions in one step; the canonical model is one action per step | Two steps |
| A real address and password in the document | Test documents get committed, mailed and pasted into chat. A secret in one is a secret published | Placeholders, and no sign-in at all |

`scripts/build-carinfo-inputs.js` builds the documents, and the reasoning is
in its header comment. The original wording is kept verbatim as TC-CI-001, and
the automatable rewrite is TC-CI-005.

Because TC-CI-001 still says "Select Google", the framework cannot automate it.
Generating the CarInfo document **skips** TC-CI-001 with
`TARGET_NOT_UNDERSTOOD`, deletes any older `generated/TC-CI-001.spec.js` (it
would no longer match the manual test case), still generates TC-CI-002 to
TC-CI-005, and exits with code 1 so the gap stays visible:

```
✗ TC-CI-001 skipped - TARGET_NOT_UNDERSTOOD: Could not resolve a locator for "Google".
...
✗ 1 test case(s) could not be automated and were skipped: TC-CI-001 (TARGET_NOT_UNDERSTOOD)
```

The catalog in `src/generator/applications/carinfo.js` also carries an honest
warning: its selectors follow the site's visible structure but have **not** been
verified against the live site yet. Run `npm run names -- https://car.info` to
read the real accessible names and adjust the catalog on the first live run.

## TNEB, and two failures that looked like one

The fifth application arrived as somebody else's Word document, and its first
real run is worth reading in full, because it was red for one reason and
*wrong* for another - and only one of them was visible.

```
✓ Step 1 → NAVIGATE  url = https://www.tnebnet.org/awp/login?locale=ta
✓ Step 2 → CLICK  target = e-Invoice link [role]
✓ Step 3 → FILL  target = Consumer No box [role], value = 0304...
...
✓ TC-EB-001 → application: YouTube
⚠ TC-EB-001 states no expected result as a step, so it passes whenever its
  steps execute
✘  TC-EB-001 - Login into EB Website (23.6s)
```

**The red one: the test case contradicted itself.** Step 1 opens the portal with
`?locale=ta`, which serves it in Tamil - every label, and therefore every
accessible name, is Tamil text. Steps 3 to 6 then ask for "Consumer No",
"Registered Mobile No" and "Download in English". No such accessible names exist
on that page, so step 3 timed out. That is not a framework bug and not a
selector to fix; it is a manual test case asking for two incompatible things.
Either open `?locale=en` or write the Tamil labels in the steps *and* in the
catalog - but not one of each.

**The invisible one: `application: YouTube`.** `tnebnet.org` matched no
registered application, so the test case fell through to
`DEFAULT_APPLICATION`. Nothing looked broken, because the analyzer's role
fallback resolves `Consumer No box` to `getByRole('textbox', { name: /Consumer
No/i })` with no catalog entry at all. The binding only decides the base URL,
and which elements an error message offers - so the symptom of
getting it wrong was being told, while testing an electricity board, that the
known elements are the video player and the YouTube logo.
`src/generator/applications/tneb.js` fixes it, and `tests/tneb.test.js` pins
both halves.

Two smaller things the document needed, which are the same lessons CarInfo
taught: it ended at "click Download in English" and asserted **nothing**, so the
generated test passed as long as six interactions did not throw - including when
no bill came back; and it carried what looked like a real consumer number and
the mobile number registered against it. `scripts/build-tneb-inputs.js` is the
reworked document, with Verify steps and invented account details, and its
header comment records why. It numbers its cases `TC-TNEB-*`: the hand-written
`input/EB-tests.docx` is still in the repository and still owns `TC-EB-001`, and
two documents sharing a test case id would overwrite each other's generated spec
with no warning at all. As with CarInfo, the catalog's selectors have
**not** yet been verified against the live portal.

`input/EB-tests.docx` itself now ends with a check as well: step 7, "Verify
that the invoice summary is visible", so TC-EB-001 can fail when no invoice
comes back. It still opens the portal with `?locale=ta`, so on the live site it
can still fail at step 3 for the locale reason described above.

## Reading the real page, when the catalog was a guess

A catalog written without the live site in front of you is a guess: nothing
says whether `getByRole('textbox', { name: /consumer\s*(no|number)/i })` matches
anything on tnebnet.org until it runs there.

`npm run names` closes that gap by printing the real page's accessibility tree -
Playwright's own computed names, the ones `getByRole()` matches on:

```bash
npm run names -- "https://www.tnebnet.org/awp/login?locale=en" --click "e-Invoice"
```

```
- textbox "Consumer No."
- textbox "Registered Mobile No"
- button "Download in English"
```

`--click` opens a tab first, for fields that are not in the DOM until it does.
A `textbox` that shows up with **no** name but a `/placeholder:` child needs
`getByPlaceholder()` - the next tier down in `src/generator/selectorStrategy.js`.
Paste what it prints into the matching `spec:` in
`src/generator/applications/<app>.js`; that one file is the only thing that
changes.

## Credentials a test case refers to but does not state

A manual test case that needs a login writes the value by name:

```
4. Enter username as "<username>"
5. and password as "<password>"
```

`<name>` in a CarInfo test case becomes `CARINFO_<NAME>` - the variable is
`<APPLICATION>_<NAME>`, both upper-cased - and the generated spec reads it when
it runs:

```js
await page.getByLabel(/username/i).fill(fromEnv('CARINFO_USERNAME'));
```

The placeholder is deliberately **not** resolved at generation time.
Substituting then would only move the secret from one committed file to
another, because `generated/` is in version control too. Resolving at run time
means the value exists only in `.env`, which is gitignored. A missing variable
throws by name rather than filling a blank field and failing later at a
confusing assertion.

The manual wording still appears verbatim in the step title and the report, so
a reviewer sees `Enter username as "<username>"` - which is what the document
says.

## Adding a sixth application

Write one file under `src/generator/applications/` and register it:

```js
export const myapp = {
  id: 'myapp',
  name: 'My App',
  hosts: [/(^|\.)myapp\.com$/i],
  baseUrl: 'https://myapp.com',
  targets: [ /* description → locator */ ],
  assertionHints: [ /* "the basket is displayed" → ASSERT_URL /basket */ ],
  // Optional, for documents written like SauceDemo's:
  nameHints: [ /* bind by name when no step carries a URL */ ],
  dataEntry: [ /* wording for values that are not in quotes */ ],
  stepHints: [ /* wording whose verb does not name its action */ ],
  preconditionHints: [ /* what "user is logged in" means in actions */ ],
};
```

No pipeline code changes. The application is picked automatically from the URL
in step 1 of the manual test case, or from the name its prose uses.
