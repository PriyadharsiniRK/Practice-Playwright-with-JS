/**
 * Application definition: YouTube.
 *
 * An application bundles everything the framework needs to know about one site:
 * which URLs belong to it, the elements its manual test cases refer to, and the
 * domain shorthands testers use ("the video page is displayed").
 *
 * Nothing here is framework logic - adding a site means adding a file like this
 * one and registering it in ./index.js.
 */

export const youtube = {
  id: 'youtube',
  name: 'YouTube',
  /** Hostnames whose test cases resolve to this application. */
  hosts: [/(^|\.)youtube\.com$/i],
  baseUrl: 'https://www.youtube.com',
  /** Port the offline stand-in listens on (see mock/). */
  offlinePort: 4173,

  targets: [
    {
      id: 'youtube.searchBox',
      description: 'YouTube search box',
      match: [/search\s*(box|bar|input|field|text\s*box)/i, /\bsearch\b.*\b(input|field)\b/i],
      roleHints: ['combobox', 'textbox', 'searchbox'],
      spec: { kind: 'role', role: 'combobox', name: { source: 'search', flags: 'i' } },
    },
    {
      id: 'youtube.searchButton',
      description: 'YouTube search button',
      match: [/search\s*(button|icon)/i, /\bbutton\b.*\bsearch\b/i, /^search$/i],
      roleHints: ['button'],
      spec: { kind: 'role', role: 'button', name: { source: '^search$', flags: 'i' } },
    },
    {
      id: 'youtube.searchResults',
      description: 'YouTube search results list',
      match: [/search\s*results?/i, /results?\s*(list|page|section)/i],
      spec: { kind: 'css', selector: 'ytd-search' },
    },
    {
      id: 'youtube.firstSearchResult',
      description: 'first YouTube search result',
      match: [/(first|1st|top)\s+(search\s+)?(result|video)/i],
      spec: { kind: 'css', selector: 'ytd-video-renderer', nth: 'first' },
    },
    {
      id: 'youtube.videoPlayer',
      description: 'YouTube video player',
      match: [/video\s*player/i, /\bplayer\b/i],
      spec: { kind: 'css', selector: '#movie_player' },
    },
    {
      id: 'youtube.logo',
      description: 'YouTube logo',
      match: [/youtube\s*logo/i, /\blogo\b/i],
      roleHints: ['link', 'img'],
      spec: { kind: 'role', role: 'link', name: { source: 'youtube home', flags: 'i' } },
    },
    {
      id: 'youtube.videoTitle',
      description: 'video title heading on the watch page',
      match: [/video\s*title/i, /title\s*of\s*the\s*video/i],
      spec: { kind: 'css', selector: 'h1.ytd-watch-metadata' },
    },
  ],

  /**
   * Domain shorthands. A manual tester writes "the video page is displayed";
   * only someone who knows YouTube knows that means the URL contains /watch.
   */
  assertionHints: [
    { match: /\b(video|watch)\s+page\s+(is\s+)?(displayed|shown|loaded|open)/i, action: 'ASSERT_URL', value: '/watch' },
    { match: /\b(home\s*page|homepage)\s+(is\s+)?(displayed|shown|loaded)/i, action: 'ASSERT_TITLE', value: 'YouTube' },
  ],
};
