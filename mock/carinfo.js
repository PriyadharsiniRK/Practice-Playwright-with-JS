/**
 * A deliberately tiny stand-in for car.info.
 *
 * Like the other stand-ins it exists so the whole pipeline can be demonstrated
 * and run in CI without depending on a third-party site, and so the generated
 * assertions have stable data to assert about - a real registration lookup
 * returns whatever that vehicle happens to be today.
 *
 * It mirrors only the hooks the generated tests use: the header logo link, the
 * registration-number search box and button, a Log in link, the results
 * container, and the vehicle heading on /search. The generated Playwright code
 * is identical to the code that runs against the real site, apart from the
 * origin in `page.goto()`.
 */

import http from 'node:http';

const PORT = Number(process.env.CARINFO_PORT ?? 4176);
const HOST = process.env.MOCK_HOST ?? '127.0.0.1';

/**
 * Keyed by registration number, as the real site is.
 *
 * KFG40L is a real Swedish plate and the real site reports it as a Volvo XC40;
 * that is what the stand-in says too. An earlier version invented a different
 * vehicle, which made the step report contradict the live site and turned a
 * demo into a puzzle. A stand-in may be small, but where it overlaps reality it
 * should agree with it - the make and model here come from the live page.
 *
 * Nothing beyond make and model is listed, because nothing beyond make and
 * model has been observed. Inventing specifications would reintroduce exactly
 * the problem this comment exists to record.
 */
const VEHICLES = {
  KFG40L: { make: 'Volvo', model: 'XC40' },
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const STYLE = `
  :root { color-scheme: light dark; font-family: Inter, Arial, sans-serif; }
  body { margin: 0; }
  header { display: flex; align-items: center; gap: 16px; padding: 10px 20px;
           background: #10202e; color: #fff; }
  #logo { font-weight: 700; font-size: 20px; color: inherit; text-decoration: none; }
  form { display: flex; flex: 1; max-width: 520px; }
  input[name="q"] { flex: 1; padding: 9px 12px; border: 1px solid #ccc;
                    border-radius: 4px 0 0 4px; text-transform: uppercase; }
  button { padding: 9px 18px; border: 0; border-radius: 0 4px 4px 0;
           background: #2f80ed; color: #fff; font-weight: 600; cursor: pointer; }
  .login { margin-left: auto; color: #fff; text-decoration: none; font-weight: 600; }
  main { padding: 20px; max-width: 860px; }
  .vehicle-results { display: block; }
  .vehicle-card { border: 1px solid #ddd; border-radius: 8px; padding: 18px; margin-top: 14px; }
  h1.vehicle-heading { font-size: 22px; margin: 0 0 10px; }
  dl { display: grid; grid-template-columns: 140px 1fr; gap: 6px 14px; margin: 0; }
  dt { color: #666; }
  .not-found { color: #b4232b; }
`;

const chrome = (query = '') => `
  <header>
    <a id="logo" href="/" aria-label="car.info home">car.info</a>
    <form action="/" method="get" role="search">
      <input type="text" name="s" aria-label="Registration number"
             placeholder="Registration number" autocomplete="off" value="${escapeHtml(query)}" />
    </form>
    <a class="login" href="/login">Log in</a>
  </header>
`;

const page = (title, body, query) => `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
  <body>${chrome(query)}<main>${body}</main></body>
</html>`;

const homePage = () =>
  page(
    'car.info - vehicle information',
    `<h1>Look up a vehicle</h1>
     <p>Enter a registration number to see the vehicle's details.</p>`,
  );

function searchPage(rawQuery) {
  const plate = (rawQuery ?? '').trim().toUpperCase();
  const vehicle = VEHICLES[plate];

  if (!vehicle) {
    return page(
      `${plate} - car.info`,
      `<div class="vehicle-results">
         <p class="not-found">No vehicle found for "${escapeHtml(plate)}".</p>
       </div>`,
      plate,
    );
  }

  return page(
    `${plate} ${vehicle.make} ${vehicle.model} - car.info`,
    `<div class="vehicle-results">
       <div class="vehicle-card">
         <h1 class="vehicle-heading">${escapeHtml(plate)} ${escapeHtml(vehicle.make)} ${escapeHtml(
           vehicle.model,
         )}</h1>
         <p class="limited">You currently have a limited use of Car.info.</p>
       </div>
     </div>`,
    plate,
  );
}

/**
 * A stub. The real site offers Google sign-in here; the test cases deliberately
 * stop at "a Log in link is offered" rather than driving OAuth, which is built
 * to resist automation.
 */
const loginPage = () =>
  page('Log in - car.info', `<h1>Log in</h1><p>Sign-in is out of scope for these test cases.</p>`);

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);
  let body;

  // The real site searches with a query parameter on the root path
  // (car.info/?s=KFG40L) rather than a separate results path.
  if (url.pathname === '/' && url.searchParams.has('s')) body = searchPage(url.searchParams.get('s'));
  else if (url.pathname === '/login') body = loginPage();
  else if (url.pathname === '/') body = homePage();

  if (body == null) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(body);
});

server.listen(PORT, HOST, () => {
  console.log(`car.info stand-in listening on http://${HOST}:${PORT}/`);
});
