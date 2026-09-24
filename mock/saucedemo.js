/**
 * A deliberately tiny stand-in for saucedemo.com.
 *
 * Like the other stand-ins, it exists so the whole pipeline can be demonstrated
 * and run in CI without depending on a third-party demo site being up.
 *
 * It mirrors only the hooks the generated tests use: the Username/Password
 * placeholders and Login button, the error banner, the Products heading, two
 * products with add/remove buttons, the cart, the sort dropdown, and the
 * checkout flow through to the confirmation message. Paths match the real site
 * (/inventory.html, /cart.html, /checkout-step-one.html, ...) because the
 * generated assertions check them. The generated Playwright code is identical
 * to the code that runs against the real site, apart from the origin in
 * `page.goto()`.
 *
 * State lives in a single module-level object. That is fine for a stand-in
 * driven by one worker at a time, and it keeps the file readable.
 */

import http from 'node:http';

const PORT = Number(process.env.SAUCEDEMO_PORT ?? 4175);
const HOST = process.env.MOCK_HOST ?? '127.0.0.1';

const VALID = { username: 'standard_user', password: 'secret_sauce' };

const PRODUCTS = [
  { slug: 'sauce-labs-backpack', name: 'Sauce Labs Backpack', price: 29.99 },
  { slug: 'sauce-labs-onesie', name: 'Sauce Labs Onesie', price: 7.99 },
];

/** Reset per login, which is how each generated test case starts. */
let state = { loggedIn: false, cart: [], sort: 'az' };

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const STYLE = `
  :root { color-scheme: light dark; font-family: sans-serif; }
  body { margin: 0; padding: 0; }
  header { display: flex; align-items: center; justify-content: space-between;
           padding: 12px 20px; background: #132238; color: #fff; }
  .shopping_cart_link { color: #fff; text-decoration: none; font-weight: 700; }
  main { padding: 20px; }
  .login-wrap { max-width: 320px; margin: 60px auto; }
  input, select { width: 100%; padding: 8px 10px; margin: 6px 0;
                  border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
  button { padding: 8px 14px; border: 0; border-radius: 4px; background: #3ddc91;
           color: #132238; font-weight: 700; cursor: pointer; margin-top: 8px; }
  [data-test="error"] { margin-top: 14px; padding: 10px; background: #e2231a; color: #fff; border-radius: 4px; }
  .inventory_item { border-bottom: 1px solid #ddd; padding: 14px 0; }
  .inventory_item_name { font-weight: 700; font-size: 18px; }
  .inventory_item_price { font-weight: 700; }
  .complete-header { font-size: 22px; font-weight: 700; margin-top: 16px; }
`;

const page = (title, body) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
<body>${body}</body>
</html>`;

const shell = (title, body) =>
  page(
    title,
    `<header><span>Swag Labs</span><a class="shopping_cart_link" href="/cart.html">cart (${state.cart.length})</a></header>
     <main>${body}</main>`,
  );

function loginPage(error) {
  return page(
    'Swag Labs',
    `<div class="login-wrap">
       <form method="POST" action="/">
         <input placeholder="Username" name="username" data-test="username">
         <input placeholder="Password" name="password" type="password" data-test="password">
         <button type="submit" name="login-button" data-test="login-button">Login</button>
       </form>
       ${error ? `<div data-test="error">Epic sadface: ${escapeHtml(error)}</div>` : ''}
     </div>`,
  );
}

/** Products, in the order the current sort asks for. */
function sortedProducts() {
  const items = [...PRODUCTS];
  if (state.sort === 'lohi') items.sort((a, b) => a.price - b.price);
  else if (state.sort === 'hilo') items.sort((a, b) => b.price - a.price);
  else items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

function inventoryPage() {
  const options = [
    ['az', 'Name (A to Z)'],
    ['za', 'Name (Z to A)'],
    ['lohi', 'Price (low to high)'],
    ['hilo', 'Price (high to low)'],
  ]
    .map(([value, label]) =>
      `<option value="${value}"${state.sort === value ? ' selected' : ''}>${label}</option>`,
    )
    .join('');

  const items = sortedProducts()
    .map((product) => {
      const inCart = state.cart.includes(product.slug);
      const action = inCart
        ? `<button data-test="remove-${product.slug}" onclick="go('/cart/remove/${product.slug}')">Remove</button>`
        : `<button data-test="add-to-cart-${product.slug}" onclick="go('/cart/add/${product.slug}')">Add to cart</button>`;
      return `<div class="inventory_item">
                <div class="inventory_item_name">${escapeHtml(product.name)}</div>
                <div class="inventory_item_price">$${product.price.toFixed(2)}</div>
                ${action}
              </div>`;
    })
    .join('');

  return shell(
    'Swag Labs',
    `<h1>Products</h1>
     <select data-test="product_sort_container" onchange="go('/sort/' + this.value)">${options}</select>
     ${items}
     <script>function go(url) { location.href = url; }</script>`,
  );
}

function cartPage() {
  const items = state.cart
    .map((slug) => {
      const product = PRODUCTS.find((candidate) => candidate.slug === slug);
      return `<div class="inventory_item">
                <div class="inventory_item_name">${escapeHtml(product.name)}</div>
                <div class="inventory_item_price">$${product.price.toFixed(2)}</div>
                <button data-test="remove-${slug}" onclick="go('/cart/remove/${slug}')">Remove</button>
              </div>`;
    })
    .join('');

  return shell(
    'Swag Labs',
    `<h1>Your Cart</h1>
     ${items}
     <button data-test="checkout" onclick="go('/checkout-step-one.html')">Checkout</button>
     <script>function go(url) { location.href = url; }</script>`,
  );
}

const checkoutOne = () =>
  shell(
    'Swag Labs',
    `<h1>Checkout: Your Information</h1>
     <form method="POST" action="/checkout-step-two.html">
       <input placeholder="First Name" name="firstName" data-test="firstName">
       <input placeholder="Last Name" name="lastName" data-test="lastName">
       <input placeholder="Zip/Postal Code" name="postalCode" data-test="postalCode">
       <button type="submit" data-test="continue">Continue</button>
     </form>`,
  );

const checkoutTwo = () =>
  shell(
    'Swag Labs',
    `<h1>Checkout: Overview</h1>
     <button data-test="finish" onclick="location.href='/checkout-complete.html'">Finish</button>`,
  );

const complete = () =>
  shell('Swag Labs', `<h1>Checkout: Complete!</h1><div class="complete-header">Thank you for your order!</div>`);

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
  res.end(body);
};

const redirect = (res, location) => {
  res.writeHead(303, { location });
  res.end();
};

/** Reads a urlencoded form body. */
async function formBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString());
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${HOST}:${PORT}`);

  if (req.method === 'POST' && pathname === '/') {
    const form = await formBody(req);
    const ok = form.get('username') === VALID.username && form.get('password') === VALID.password;
    if (!ok) {
      return send(res, 200, loginPage('Username and password do not match any user in this service'));
    }
    // A fresh login is a fresh session, which is how each test case starts.
    state = { loggedIn: true, cart: [], sort: 'az' };
    return redirect(res, '/inventory.html');
  }

  if (req.method === 'POST' && pathname === '/checkout-step-two.html') {
    await formBody(req);
    return redirect(res, '/checkout-step-two.html');
  }

  if (pathname === '/' || pathname === '/index.html') return send(res, 200, loginPage(null));

  const addMatch = pathname.match(/^\/cart\/add\/(.+)$/);
  if (addMatch) {
    if (!state.cart.includes(addMatch[1])) state.cart.push(addMatch[1]);
    return redirect(res, req.headers.referer?.includes('/cart.html') ? '/cart.html' : '/inventory.html');
  }

  const removeMatch = pathname.match(/^\/cart\/remove\/(.+)$/);
  if (removeMatch) {
    state.cart = state.cart.filter((slug) => slug !== removeMatch[1]);
    return redirect(res, req.headers.referer?.includes('/cart.html') ? '/cart.html' : '/inventory.html');
  }

  const sortMatch = pathname.match(/^\/sort\/(.+)$/);
  if (sortMatch) {
    state.sort = sortMatch[1];
    return redirect(res, '/inventory.html');
  }

  switch (pathname) {
    case '/inventory.html':
      return send(res, 200, inventoryPage());
    case '/cart.html':
      return send(res, 200, cartPage());
    case '/checkout-step-one.html':
      return send(res, 200, checkoutOne());
    case '/checkout-step-two.html':
      return send(res, 200, checkoutTwo());
    case '/checkout-complete.html':
      return send(res, 200, complete());
    default:
      return send(res, 404, page('Not found', '<h1>Not found</h1>'));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`SauceDemo stand-in listening on http://${HOST}:${PORT}/`);
});
