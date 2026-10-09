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

/**
 * The buttons that close YouTube's cookie consent, in English and the common
 * EU languages YouTube may show it in. "Reject all" comes first in the dialog,
 * so it is the one clicked when both are present.
 */
const CONSENT_BUTTON_TEXT = {
  source:
    'reject all|accept all|alle ablehnen|alle akzeptieren|tout refuser|tout accepter|' +
    'rechazar todo|aceptar todo|rifiuta tutto|accetta tutto|alles afwijzen|alles accepteren|' +
    'avvisa alla|godkänn alla|afvis alle|accepter alle|avvis alle|godta alle|' +
    'hylkää kaikki|hyväksy kaikki|odrzuć wszystko|zaakceptuj wszystko|rejeitar tudo|aceitar tudo',
  flags: 'i',
};

export const youtube = {
  id: 'youtube',
  name: 'YouTube',
  /** Hostnames whose test cases resolve to this application. */
  hosts: [/(^|\.)youtube\.com$/i],
  baseUrl: 'https://www.youtube.com',

  targets: [
    {
      // The dialog itself has no box of its own, so the target is the button
      // that closes it - on the dialog over the page and on consent.youtube.com.
      id: 'youtube.consentDialog',
      description: 'cookie consent dialog',
      match: [/\b(cookie|consent)\b/i],
      spec: {
        kind: 'css',
        selector: 'ytd-consent-bump-v2-lightbox button, form[action*="consent.youtube.com"] button',
        hasText: CONSENT_BUTTON_TEXT,
        nth: 'first',
      },
    },
    {
      // One or more ads can play before the video, skippable or not. While any
      // ad plays YouTube marks the player with the "ad-showing" class, so the
      // step waits for that class to go, clicking Skip whenever it is offered.
      id: 'youtube.skipAdButton',
      description: 'video ad',
      match: [/\b(ads?|advert\w*)\b/i],
      spec: {
        kind: 'css',
        selector: '#movie_player .ytp-skip-ad-button, #movie_player .ytp-ad-skip-button, #movie_player .ytp-ad-skip-button-modern',
        nth: 'first',
        whileShowing: '#movie_player.ad-showing',
        // Ads start a moment after the page loads; unskippable ones run up to
        // about 30 seconds, and YouTube may play two in a row.
        appearTimeout: 5_000,
        waitTimeout: 90_000,
      },
    },
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
      id: 'youtube.noResultsMessage',
      description: 'no results message',
      match: [/no\s+results?\s*(message|text|found)?/i, /empty\s*results?/i],
      spec: { kind: 'css', selector: 'ytd-background-promo-renderer' },
    },
    {
      id: 'youtube.playPauseButton',
      description: 'Play/Pause button',
      match: [/play\s*\/?\s*pause\s*(button)?/i, /\bplay\s*(button)?\b/i, /\bpause\s*(button)?\b/i],
      roleHints: ['button'],
      // Icon button: its words ("Play"/"Pause") are only in the accessible name.
      spec: { kind: 'css', selector: '#movie_player .ytp-play-button', textFrom: 'accessibleName' },
    },
    {
      id: 'youtube.muteButton',
      description: 'Mute button',
      match: [/\b(un)?mute\s*(button|control|toggle)?\b/i],
      roleHints: ['button'],
      // Icon button: its words ("Mute"/"Unmute") are only in the accessible name.
      spec: { kind: 'css', selector: '#movie_player .ytp-mute-button', textFrom: 'accessibleName' },
    },
    {
      id: 'youtube.fullScreenButton',
      description: 'Full screen button',
      match: [/full\s*screen\s*(button|control|toggle)?/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: '#movie_player .ytp-fullscreen-button' },
    },
    {
      id: 'youtube.volumeSlider',
      description: 'volume slider',
      match: [/volume\s*(slider|control|bar)?/i],
      roleHints: ['slider'],
      // Expands while the pointer is over the mute button.
      spec: { kind: 'css', selector: '#movie_player .ytp-volume-panel' },
    },
    {
      id: 'youtube.channelLink',
      description: 'channel name link',
      match: [/channel\s*(name|link)?/i, /creator\s*(name|link)?/i],
      roleHints: ['link'],
      spec: { kind: 'css', selector: 'ytd-watch-metadata ytd-channel-name a', nth: 'first' },
    },
    {
      id: 'youtube.channelTitle',
      description: 'channel page heading',
      // Not "channel page title": "page title" means the browser tab, so that
      // wording would be read as a document-title assertion.
      match: [/channel\s*page\s*(heading|title)/i, /channel\s*heading/i],
      roleHints: ['heading'],
      spec: { kind: 'css', selector: 'yt-page-header-renderer h1', nth: 'first' },
    },
    {
      id: 'youtube.showMoreButton',
      description: 'Show more button on the description',
      match: [/show\s*more\s*(button)?/i, /expand\s*(the\s*)?description/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: 'ytd-watch-metadata #description-inline-expander #expand' },
    },
    {
      id: 'youtube.descriptionDetail',
      description: 'expanded description text',
      match: [/expanded\s*description/i, /description\s*(detail|more)/i],
      // The "Show less" control is only shown while the description is expanded.
      spec: { kind: 'css', selector: 'ytd-watch-metadata #description-inline-expander #collapse' },
    },
    {
      id: 'youtube.description',
      description: 'video description',
      match: [/\bdescription\b/i],
      spec: { kind: 'css', selector: 'ytd-watch-metadata #description' },
    },
    {
      id: 'youtube.commentsSection',
      description: 'Comments section',
      match: [/comments?\s*(section|area|list)?/i],
      spec: { kind: 'css', selector: 'ytd-comments#comments' },
    },
    {
      id: 'youtube.likeButton',
      description: 'Like button',
      match: [/\blike\s*(button)?\b/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: 'ytd-watch-metadata like-button-view-model button', nth: 'first' },
    },
    {
      id: 'youtube.subscribeButton',
      description: 'Subscribe button',
      match: [/subscribe\s*(button)?/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: 'ytd-watch-metadata #subscribe-button button', nth: 'first' },
    },
    {
      id: 'youtube.signInPrompt',
      description: 'sign-in prompt',
      match: [/sign[-\s]?in\s*(prompt|message|dialog)?/i],
      // The "Sign in" pop-up YouTube shows a signed-out viewer who likes or subscribes.
      spec: { kind: 'css', selector: 'ytd-modal-with-title-and-button-renderer', nth: 'first' },
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
