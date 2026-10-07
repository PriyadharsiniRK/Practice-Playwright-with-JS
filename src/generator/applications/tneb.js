/**
 * Application definition: TNEB (tnebnet.org).
 *
 * The Tamil Nadu Electricity Board consumer portal. The journey the manual
 * document covers is the e-Invoice download: pick the e-Invoice tab, identify
 * yourself with a consumer number, a registered mobile number and a billing
 * month, and download the bill.
 *
 * Two things about this site shape the catalog.
 *
 * It is bilingual. The portal takes a `locale` query parameter, and
 * `?locale=ta` serves Tamil - every visible label, and therefore every
 * accessible name, is Tamil text. A locator written against the English
 * wording cannot match that page. The name regexes here are English, so a test
 * case for this application has to open the site with `?locale=en`; a step that
 * asks for `?locale=ta` and then looks for "Consumer No" is asking for two
 * incompatible things. That is a property of the site, not of the framework,
 * which is why it is recorded here rather than worked around in code.
 *
 * The fields live behind a tab. They are not on the page when it loads; the
 * e-Invoice tab has to be chosen first. The generated test does that as its own
 * step, so nothing special is needed here, but it does mean a failure on the
 * first field is as likely to be a tab that never opened as a field whose name
 * changed. The step report distinguishes the two: look at which step is red.
 *
 * NOTE: as with car.info, these selectors follow the portal's visible structure
 * but have NOT been verified against the live site - tnebnet.org is not
 * reachable from the sandbox this was written in. They are verified against
 * mock/tneb.js. Expect to adjust them on the first real run; a target catalog
 * is exactly the one file where that adjustment belongs.
 */

export const tneb = {
  id: 'tneb',
  name: 'TNEB',
  hosts: [/(^|\.)tnebnet\.org$/i],
  baseUrl: 'https://www.tnebnet.org',
  /** Port the offline stand-in listens on (see mock/tneb.js). */
  offlinePort: 4177,
  /**
   * Wording that binds a test case to this application when no step carries a
   * URL. "EB" is how the document under test refers to the site, and is worth
   * accepting even though it is an abbreviation an outsider would not know.
   */
  nameHints: [/\btneb(net)?\b/i, /\belectricity\s*board\b/i, /\beb\s*(web\s*site|site|portal)\b/i],

  targets: [
    {
      id: 'tneb.eInvoiceTab',
      description: 'e-Invoice tab',
      // The portal renders these as links in a tab strip, so both words are
      // accepted: a manual tester writes "tab", the markup says "link".
      match: [/e\s*-?\s*invoice\s*(tab|link|menu|option)?/i],
      roleHints: ['link', 'tab', 'button'],
      spec: { kind: 'role', role: 'link', name: { source: 'e-?\\s*invoice', flags: 'i' } },
    },
    {
      id: 'tneb.consumerNo',
      description: 'Consumer No box',
      // "Consumer No", "Consumer No." and "Consumer Number" are the same field.
      match: [/consumer\s*(no\.?|number|id)\s*(box|field|input|text\s*box)?/i],
      roleHints: ['textbox'],
      spec: { kind: 'role', role: 'textbox', name: { source: 'consumer\\s*(no|number)', flags: 'i' } },
    },
    {
      id: 'tneb.mobileNo',
      description: 'Registered Mobile No box',
      match: [
        /(registered\s*)?mobile\s*(no\.?|number)\s*(box|field|input|text\s*box)?/i,
        /\bmobile\b/i,
      ],
      roleHints: ['textbox'],
      spec: { kind: 'role', role: 'textbox', name: { source: 'mobile\\s*(no|number)', flags: 'i' } },
    },
    {
      id: 'tneb.billMonth',
      description: 'Bill Month/Year box',
      match: [
        /bill\s*month\s*\/?\s*year\s*(box|field|input|text\s*box)?/i,
        /\b(bill\s*)?month\s*\/?\s*year\b/i,
      ],
      roleHints: ['textbox'],
      spec: { kind: 'role', role: 'textbox', name: { source: 'month\\s*/?\\s*year', flags: 'i' } },
    },
    {
      id: 'tneb.downloadEnglishButton',
      description: 'Download in English button',
      match: [/download\s*(in\s*)?english\s*(button)?/i],
      roleHints: ['button', 'link'],
      spec: { kind: 'role', role: 'button', name: { source: 'download\\s*(in\\s*)?english', flags: 'i' } },
    },
    {
      id: 'tneb.downloadTamilButton',
      description: 'Download in Tamil button',
      match: [/download\s*(in\s*)?tamil\s*(button)?/i],
      roleHints: ['button', 'link'],
      spec: { kind: 'role', role: 'button', name: { source: 'download\\s*(in\\s*)?tamil', flags: 'i' } },
    },
    {
      id: 'tneb.invoiceSummary',
      description: 'invoice summary',
      match: [
        /invoice\s*(summary|details?|card|panel|section)/i,
        /\bbill\s*(summary|details?)\b/i,
      ],
      spec: { kind: 'css', selector: '.invoice-summary' },
    },
    {
      id: 'tneb.errorMessage',
      description: 'error message',
      match: [/error\s*(message|banner|text)?/i, /validation\s*message/i],
      spec: { kind: 'css', selector: '.error-message' },
    },
  ],

  /**
   * Domain shorthands. A manual tester writes "the e-Invoice page is
   * displayed"; only someone who knows the portal knows which path that is.
   */
  assertionHints: [
    {
      match: /\be\s*-?\s*invoice\s+(page|form|screen)\s+(is\s+)?(displayed|shown|loaded|open)/i,
      action: 'ASSERT_VISIBLE',
      target: 'Consumer No box',
    },
    {
      match: /\b(login|home)\s*page\s+(is\s+)?(displayed|shown|loaded|open)/i,
      action: 'ASSERT_URL',
      value: '/awp/login',
    },
    {
      match: /\b(invoice|bill)\s+(is\s+)?(displayed|shown|generated|downloaded)/i,
      action: 'ASSERT_VISIBLE',
      target: 'invoice summary',
    },
  ],
};
