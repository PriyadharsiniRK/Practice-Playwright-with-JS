/**
 * A deliberately tiny stand-in for the OrangeHRM demo instance.
 *
 * Like mock/server.js, it exists so the whole pipeline can be demonstrated and
 * run in CI without depending on a third-party demo site being up - and without
 * a test suite repeatedly logging in to someone else's server.
 *
 * It mirrors only the hooks the generated tests use: the Username/Password
 * placeholders, the Login button, the "Invalid credentials" message, the
 * Dashboard heading, the sidebar menu links and the user dropdown. The
 * generated Playwright code is identical to the code that runs against the real
 * site, apart from the origin in `page.goto()`.
 */

import http from 'node:http';

const PORT = Number(process.env.ORANGEHRM_PORT ?? 4174);
const HOST = process.env.MOCK_HOST ?? '127.0.0.1';

const VALID = { username: 'Admin', password: 'admin123' };
const LOGIN_PATH = '/web/index.php/auth/login';
const DASHBOARD_PATH = '/web/index.php/dashboard/index';
const PIM_PATH = '/web/index.php/pim/viewEmployeeList';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const STYLE = `
  :root { color-scheme: light dark; font-family: sans-serif; }
  body { margin: 0; }
  .login-wrap { max-width: 340px; margin: 60px auto; padding: 24px; border: 1px solid #ccc; border-radius: 12px; }
  .brand { font-weight: 700; color: #ff7b1c; font-size: 22px; margin-bottom: 20px; }
  label { display: block; font-size: 13px; margin: 12px 0 4px; }
  input { width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
  button { width: 100%; margin-top: 18px; padding: 9px; border: 0; border-radius: 16px;
           background: #ff7b1c; color: #fff; font-weight: 600; cursor: pointer; }
  .oxd-alert { margin-top: 14px; padding: 10px; border: 1px solid #e4504d; border-radius: 4px; color: #e4504d; }
  .shell { display: flex; min-height: 100vh; }
  .sidebar { width: 200px; background: #f6f5fb; padding: 16px; }
  .sidebar a { display: block; padding: 8px 6px; text-decoration: none; color: inherit; border-radius: 4px; }
  .topbar { display: flex; justify-content: space-between; align-items: center;
            padding: 12px 20px; border-bottom: 1px solid #ddd; }
  .oxd-topbar-header-breadcrumb-module { margin: 0; font-size: 20px; }
  .oxd-userdropdown-name { font-size: 14px; }
  main { flex: 1; }
  .content { padding: 20px; }
`;

const page = (title, body) => `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
  <body>${body}</body>
</html>`;

function loginPage({ error = false } = {}) {
  return page(
    'OrangeHRM',
    `<div class="login-wrap">
       <div class="brand">OrangeHRM</div>
       <form action="${LOGIN_PATH}" method="get">
         <label for="username">Username</label>
         <input id="username" name="username" type="text" placeholder="Username" autocomplete="off" />
         <label for="password">Password</label>
         <input id="password" name="password" type="password" placeholder="Password" autocomplete="off" />
         <button type="submit">Login</button>
       </form>
       ${error ? '<div class="oxd-alert" role="alert">Invalid credentials</div>' : ''}
     </div>`,
  );
}

const MENU = ['Admin', 'PIM', 'Leave', 'Time', 'Recruitment', 'My Info', 'Performance', 'Dashboard', 'Directory'];

function shell(heading, inner) {
  const links = MENU.map((item) => {
    const href = item === 'PIM' ? PIM_PATH : item === 'Dashboard' ? DASHBOARD_PATH : '#';
    return `<a href="${href}">${escapeHtml(item)}</a>`;
  }).join('\n');

  return page(
    'OrangeHRM',
    `<div class="shell">
       <nav class="sidebar">
         <div class="brand">OrangeHRM</div>
         <input type="text" placeholder="Search" aria-label="Sidebar search" />
         ${links}
       </nav>
       <main>
         <div class="topbar">
           <h6 class="oxd-topbar-header-breadcrumb-module">${escapeHtml(heading)}</h6>
           <span class="oxd-userdropdown-name">paul collings</span>
         </div>
         <div class="content">${inner}</div>
       </main>
     </div>`,
  );
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const username = url.searchParams.get('username');
  const password = url.searchParams.get('password');

  // The real site posts to /auth/validate; a GET keeps the stand-in tiny.
  if (url.pathname === LOGIN_PATH && username != null) {
    if (username === VALID.username && password === VALID.password) {
      response.writeHead(302, { location: DASHBOARD_PATH });
      response.end();
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    response.end(loginPage({ error: true }));
    return;
  }

  let body;
  if (url.pathname === '/' || url.pathname === '/web/index.php') {
    response.writeHead(302, { location: LOGIN_PATH });
    response.end();
    return;
  }
  if (url.pathname === LOGIN_PATH) body = loginPage();
  else if (url.pathname === DASHBOARD_PATH) body = shell('Dashboard', '<p>Welcome back.</p>');
  else if (url.pathname === PIM_PATH) body = shell('PIM', '<p>Employee list</p>');

  if (body == null) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(body);
});

server.listen(PORT, HOST, () => {
  console.log(`OrangeHRM stand-in listening on http://${HOST}:${PORT}/`);
});
