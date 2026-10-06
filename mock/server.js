/**
 * A deliberately tiny stand-in for youtube.com.
 *
 * It exists so the *whole* pipeline - parse, analyze, generate, execute,
 * report - can be demonstrated and run in CI without depending on youtube.com
 * being reachable, and without a real test suite hammering a third-party site.
 *
 * It mirrors only the handful of accessibility hooks the generated tests use:
 * the "Search" combobox and button, the ytd-search results container,
 * ytd-video-renderer result rows, the "YouTube Home" logo link and the
 * #movie_player element on /watch. The generated Playwright code is byte for
 * byte the same as the code that runs against the real site, apart from the
 * origin in `page.goto()`.
 */

import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT ?? 4173);
const HOST = process.env.MOCK_HOST ?? '127.0.0.1';

const VIDEOS = [
  { id: 'pw001', title: 'Playwright automation - full course for beginners', channel: 'Test Automation University' },
  { id: 'pw002', title: 'Playwright vs Selenium: which should you learn?', channel: 'QA Weekly' },
  { id: 'pw003', title: 'Writing your first Playwright test in JavaScript', channel: 'Coding with Priya' },
];

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const STYLE = `
  :root { color-scheme: light dark; font-family: Roboto, Arial, sans-serif; }
  body { margin: 0; }
  header { display: flex; align-items: center; gap: 16px; padding: 8px 16px; border-bottom: 1px solid #ccc; }
  #logo { font-weight: 700; font-size: 20px; text-decoration: none; color: inherit; }
  form { display: flex; flex: 1; max-width: 640px; }
  input[role='combobox'] { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 18px 0 0 18px; }
  button { padding: 8px 20px; border: 1px solid #ccc; border-left: 0; border-radius: 0 18px 18px 0; cursor: pointer; }
  ytd-search, ytd-video-renderer, ytd-watch-flexy { display: block; }
  ytd-video-renderer { padding: 12px 0; border-bottom: 1px solid #eee; }
  ytd-video-renderer a { display: block; text-decoration: none; color: inherit; }
  .result-title { font-size: 18px; }
  .result-channel { font-size: 14px; opacity: 0.7; }
  main { padding: 16px; max-width: 900px; }
  #movie_player { width: 100%; aspect-ratio: 16 / 9; background: #000; color: #fff;
                  display: flex; align-items: center; justify-content: center; }
  .player-controls, .owner-actions { display: flex; gap: 8px; align-items: center; margin: 10px 0; }
  .player-controls button, .owner-actions button { padding: 6px 14px; border: 1px solid #ccc;
                  border-radius: 18px; background: #f2f2f2; cursor: pointer; }
  #channel-name { font-weight: 600; color: inherit; }
  #comments { margin-top: 20px; border-top: 1px solid #eee; padding-top: 12px; }
  .no-results { color: #606060; font-style: italic; }
  body.fullscreen #movie_player { aspect-ratio: auto; height: 80vh; }
`;

const chrome = (query = '') => `
  <header>
    <a id="logo" href="/" aria-label="YouTube Home">YouTube</a>
    <form action="/results" method="get" role="search">
      <input type="text" role="combobox" aria-label="Search" name="search_query"
             placeholder="Search" autocomplete="off" value="${escapeHtml(query)}" />
      <button type="submit" aria-label="Search">Search</button>
    </form>
  </header>
`;

const page = (title, body, query) => `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
  <body>${chrome(query)}<main>${body}</main></body>
</html>`;

function homePage() {
  return page(
    'YouTube',
    `<h1>Recommended</h1>
     <ytd-search>
       ${VIDEOS.map(renderResult).join('\n')}
     </ytd-search>`,
  );
}

function renderResult(video) {
  // The whole row is the link, as it effectively is on YouTube - so a click
  // anywhere on the result navigates.
  return `<ytd-video-renderer>
     <a href="/watch?v=${video.id}">
       <div class="result-title">${escapeHtml(video.title)}</div>
       <div class="result-channel">${escapeHtml(video.channel)}</div>
     </a>
   </ytd-video-renderer>`;
}

function resultsPage(query) {
  const matches = VIDEOS.filter((video) =>
    query ? video.title.toLowerCase().includes(query.toLowerCase().split(' ')[0]) : true,
  );
  return page(
    `${query} - YouTube`,
    `<ytd-search>
       <p>${matches.length} results for "${escapeHtml(query)}"</p>
       ${
         matches.length
           ? matches.map(renderResult).join('\n')
           : '<p class="no-results">No results found. Try different keywords.</p>'
       }
     </ytd-search>`,
    query,
  );
}

function watchPage(videoId) {
  const video = VIDEOS.find((candidate) => candidate.id === videoId) ?? VIDEOS[0];
  return page(
    `${video.title} - YouTube`,
    `<ytd-watch-flexy>
       <div id="movie_player">Now playing</div>
       <div class="player-controls">
         <button id="play-pause" aria-label="Play">Play</button>
         <button id="mute" aria-label="Mute">Mute</button>
         <button id="fullscreen" aria-label="Full screen">Full screen</button>
         <input id="volume" type="range" min="0" max="100" value="100" aria-label="Volume" />
       </div>
       <h1 class="ytd-watch-metadata">${escapeHtml(video.title)}</h1>
       <a id="channel-name" href="/channel/${escapeHtml(video.channel)}">${escapeHtml(video.channel)}</a>
       <div class="owner-actions">
         <button id="subscribe-button" aria-label="Subscribe">Subscribe</button>
         <button id="like-button" aria-label="Like">Like</button>
       </div>
       <div id="description">
         <p id="description-text">A short course on automating the browser.</p>
         <button id="expand" aria-label="Show more">Show more</button>
         <p id="description-more" hidden>Chapters, links and credits.</p>
       </div>
       <div id="comments">
         <h2>Comments</h2>
         <p class="comment">Great explanation, thanks!</p>
       </div>
       <p id="signin-prompt" hidden>Sign in to like this video.</p>
       <script>
         const byId = (id) => document.getElementById(id);
         byId('play-pause').onclick = (event) => {
           const playing = event.target.textContent === 'Pause';
           event.target.textContent = playing ? 'Play' : 'Pause';
           event.target.setAttribute('aria-label', playing ? 'Play' : 'Pause');
         };
         byId('mute').onclick = (event) => {
           const muted = event.target.textContent === 'Unmute';
           event.target.textContent = muted ? 'Mute' : 'Unmute';
           event.target.setAttribute('aria-label', muted ? 'Mute' : 'Unmute');
         };
         byId('fullscreen').onclick = () => document.body.classList.toggle('fullscreen');
         byId('expand').onclick = () => { byId('description-more').hidden = false; };
         // Signed out, as every generated test is: liking or subscribing asks
         // you to sign in rather than succeeding.
         for (const id of ['like-button', 'subscribe-button']) {
           byId(id).onclick = () => { byId('signin-prompt').hidden = false; };
         }
       </script>
     </ytd-watch-flexy>`,
  );
}

function channelPage(name) {
  return page(
    `${name} - YouTube`,
    `<ytd-browse>
       <h1 class="channel-title">${escapeHtml(name)}</h1>
       <p>Videos from this channel.</p>
     </ytd-browse>`,
  );
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  let body;

  if (url.pathname === '/results') body = resultsPage(url.searchParams.get('search_query') ?? '');
  else if (url.pathname === '/watch') body = watchPage(url.searchParams.get('v'));
  else if (url.pathname.startsWith('/channel/')) {
    body = channelPage(decodeURIComponent(url.pathname.slice('/channel/'.length)));
  } else if (url.pathname === '/') body = homePage();

  if (body == null) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(body);
});

server.listen(PORT, HOST, () => {
  console.log(`YouTube stand-in listening on http://${HOST}:${PORT}/`);
});
