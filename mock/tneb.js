/**
 * A deliberately tiny stand-in for the TNEB consumer portal (tnebnet.org).
 *
 * Like the other stand-ins it exists so the whole pipeline can be demonstrated
 * and run without depending on a third-party site, and so the generated
 * assertions have stable data to assert about.
 *
 * It mirrors only the hooks the generated tests use: the login page with its
 * tab strip, the e-Invoice form's three fields, the two Download buttons, and
 * the invoice summary the download produces.
 *
 * One thing it mirrors on purpose, because it is the whole reason the first
 * real run of TC-EB-001 was red: it honours `?locale=`. With `locale=ta` the
 * labels - and therefore the accessible names - are not English, so a locator
 * written against "Consumer No" cannot find the field. `locale=en` serves
 * English and the same test passes. That makes the failure reproducible offline
 * instead of only on the live site.
 *
 * The Tamil strings below are illustrative rather than copied from the portal.
 * Nothing asserts about them; all that matters for the demonstration is that
 * they are not the English the locator expects.
 */

import http from 'node:http';

const PORT = Number(process.env.TNEB_PORT ?? 4177);
const HOST = process.env.MOCK_HOST ?? '127.0.0.1';

/**
 * What counts as a valid request.
 *
 * Deliberately a shape rather than a list of real consumers. Hard-coding one
 * consumer number would mean committing somebody's actual account and mobile
 * number to the repository, and would also mean the stand-in only worked for
 * whoever wrote it - anyone running the demo with their own bill would get
 * "no bill found" and think the pipeline was broken. Any well-formed request
 * gets a bill; a malformed one gets the error message, which is what the
 * negative test case asserts about.
 */
const VALID = {
  consumerNo: /^\d{12}$/,
  mobileNo: /^\d{10}$/,
  billMonth: /^(0[1-9]|1[0-2])\d{4}$/,
};

/** A bill derived from the month, so the numbers are stable per request. */
const billFor = (billMonth) => {
  const units = 150 + (Number(billMonth) % 100);
  return { units, amount: (units * 4.87).toFixed(2) };
};

const LABELS = {
  en: {
    lang: 'en',
    title: 'TNEB - Consumer Portal',
    login: 'Login',
    eInvoice: 'e-Invoice',
    consumerNo: 'Consumer No',
    mobileNo: 'Registered Mobile No',
    billMonth: 'Bill Month/Year',
    downloadEnglish: 'Download in English',
    downloadTamil: 'Download in Tamil',
    heading: 'Download e-Invoice',
    notFound: 'No bill found for the details entered.',
    units: 'Units consumed',
    amount: 'Amount payable',
  },
  ta: {
    lang: 'ta',
    title: 'TNEB - நுகர்வோர் சேவை',
    login: 'உள்நுழைவு',
    // Latin even in the Tamil locale, because that is what the live portal
    // does: the first real run of TC-EB-001 against ?locale=ta clicked this
    // link successfully and only then failed on the Consumer No field. Keeping
    // the tab English and the field labels Tamil reproduces that exact failure.
    eInvoice: 'e-Invoice',
    consumerNo: 'நுகர்வோர் எண்',
    mobileNo: 'பதிவு செய்த கைபேசி எண்',
    billMonth: 'மாதம்/ஆண்டு',
    downloadEnglish: 'ஆங்கிலத்தில் பதிவிறக்கம்',
    downloadTamil: 'தமிழில் பதிவிறக்கம்',
    heading: 'மின் விலைப்பட்டியல் பதிவிறக்கம்',
    notFound: 'விவரங்களுக்கு விலைப்பட்டியல் இல்லை.',
    units: 'பயன்படுத்திய அலகுகள்',
    amount: 'செலுத்த வேண்டிய தொகை',
  },
};

const localeFor = (url) => (url.searchParams.get('locale') === 'ta' ? LABELS.ta : LABELS.en);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const STYLE = `
  :root { color-scheme: light dark; font-family: Inter, Arial, sans-serif; }
  body { margin: 0; }
  header { padding: 12px 20px; background: #0b3d2c; color: #fff; font-weight: 700; }
  nav { display: flex; gap: 4px; padding: 0 20px; background: #10543c; }
  nav a { padding: 10px 16px; color: #d9f2e6; text-decoration: none; font-weight: 600; }
  nav a[aria-current="page"] { background: #f4f6f5; color: #0b3d2c; }
  main { padding: 20px; max-width: 640px; }
  label { display: block; margin: 14px 0 4px; font-weight: 600; }
  input { width: 100%; padding: 9px 12px; border: 1px solid #ccc; border-radius: 4px; }
  .actions { display: flex; gap: 10px; margin-top: 20px; }
  button { padding: 10px 18px; border: 0; border-radius: 4px; background: #0b3d2c;
           color: #fff; font-weight: 600; cursor: pointer; }
  .invoice-summary { border: 1px solid #ddd; border-radius: 8px; padding: 18px; margin-top: 20px; }
  .error-message { color: #b4232b; font-weight: 600; margin-top: 20px; }
  dl { display: grid; grid-template-columns: 180px 1fr; gap: 6px 14px; margin: 0; }
  dt { color: #666; }
`;

const page = (labels, body, { tab = 'login' } = {}) => `<!doctype html>
<html lang="${labels.lang}">
  <head><meta charset="utf-8" /><title>${escapeHtml(labels.title)}</title><style>${STYLE}</style></head>
  <body>
    <header>TANGEDCO / TNEB</header>
    <nav>
      <a href="/awp/login?locale=${labels.lang}"${tab === 'login' ? ' aria-current="page"' : ''}>${escapeHtml(labels.login)}</a>
      <a href="/awp/einvoice?locale=${labels.lang}"${tab === 'einvoice' ? ' aria-current="page"' : ''}>${escapeHtml(labels.eInvoice)}</a>
    </nav>
    <main>${body}</main>
  </body>
</html>`;

/**
 * The login page. The e-Invoice fields are deliberately NOT here: on the real
 * portal they live behind the tab, which is why the generated test has to click
 * it before it can type anything.
 */
const loginPage = (labels) =>
  page(
    labels,
    `<h1>${escapeHtml(labels.login)}</h1>
     <p>Choose ${escapeHtml(labels.eInvoice)} to download a bill without signing in.</p>`,
    { tab: 'login' },
  );

function eInvoicePage(labels, { consumerNo = '', mobileNo = '', billMonth = '', result } = {}) {
  const field = (id, label, value, extra = '') =>
    `<label for="${id}">${escapeHtml(label)}</label>
     <input id="${id}" name="${id}" type="text" value="${escapeHtml(value)}" autocomplete="off" ${extra} />`;

  return page(
    labels,
    `<h1>${escapeHtml(labels.heading)}</h1>
     <form method="get" action="/awp/einvoice">
       <input type="hidden" name="locale" value="${labels.lang}" />
       ${field('consumerNo', labels.consumerNo, consumerNo)}
       ${field('mobileNo', labels.mobileNo, mobileNo)}
       ${field('billMonth', labels.billMonth, billMonth, 'placeholder="MMYYYY"')}
       <div class="actions">
         <button type="submit" name="lang" value="en">${escapeHtml(labels.downloadEnglish)}</button>
         <button type="submit" name="lang" value="ta">${escapeHtml(labels.downloadTamil)}</button>
       </div>
     </form>
     ${result ?? ''}`,
    { tab: 'einvoice' },
  );
}

/** Looks up a bill, and renders either the summary or the not-found message. */
function invoiceResult(labels, entered) {
  const wellFormed = Object.entries(VALID).every(([field, pattern]) =>
    pattern.test((entered[field] ?? '').trim()),
  );
  if (!wellFormed) return `<p class="error-message">${escapeHtml(labels.notFound)}</p>`;

  const { consumerNo, billMonth } = entered;
  const bill = billFor(billMonth.trim());

  return `<div class="invoice-summary">
    <dl>
      <dt>${escapeHtml(labels.consumerNo)}</dt><dd>${escapeHtml(consumerNo)}</dd>
      <dt>${escapeHtml(labels.billMonth)}</dt><dd>${escapeHtml(billMonth)}</dd>
      <dt>${escapeHtml(labels.units)}</dt><dd>${bill.units}</dd>
      <dt>${escapeHtml(labels.amount)}</dt><dd>&#8377; ${escapeHtml(bill.amount)}</dd>
    </dl>
  </div>`;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);
  const labels = localeFor(url);
  const entered = {
    consumerNo: url.searchParams.get('consumerNo') ?? '',
    mobileNo: url.searchParams.get('mobileNo') ?? '',
    billMonth: url.searchParams.get('billMonth') ?? '',
  };
  let body;

  if (url.pathname === '/awp/einvoice') {
    const submitted = url.searchParams.has('lang');
    body = eInvoicePage(labels, {
      ...entered,
      result: submitted ? invoiceResult(labels, entered) : undefined,
    });
  } else if (url.pathname === '/awp/login' || url.pathname === '/awp' || url.pathname === '/') {
    body = loginPage(labels);
  }

  if (body == null) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(body);
});

server.listen(PORT, HOST, () => {
  console.log(`TNEB stand-in listening on http://${HOST}:${PORT}/awp/login`);
});
