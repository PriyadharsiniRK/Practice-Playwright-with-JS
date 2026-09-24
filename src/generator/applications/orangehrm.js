/**
 * Application definition: OrangeHRM (the public demo instance).
 *
 * Selectors follow the OrangeHRM 5.x demo DOM. Unlike YouTube, this app is
 * login-gated and its inputs carry placeholders rather than accessible names,
 * so it exercises the getByPlaceholder and getByText tiers of the selector
 * strategy that a search-only site never reaches.
 */

export const orangehrm = {
  id: 'orangehrm',
  name: 'OrangeHRM',
  hosts: [/(^|\.)orangehrmlive\.com$/i, /(^|\.)orangehrm\.com$/i],
  baseUrl: 'https://opensource-demo.orangehrmlive.com',
  offlinePort: 4174,

  targets: [
    {
      id: 'orangehrm.usernameField',
      description: 'username field',
      // The demo's inputs have no label or accessible name - only a placeholder.
      match: [/user\s*name\s*(box|field|input)?/i, /\buser\s+id\b/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: 'username', flags: 'i' } },
    },
    {
      id: 'orangehrm.passwordField',
      description: 'password field',
      match: [/pass\s*word\s*(box|field|input)?/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: 'password', flags: 'i' } },
    },
    {
      id: 'orangehrm.loginButton',
      description: 'login button',
      match: [/log\s*in\s*(button)?/i, /sign\s*in\s*(button)?/i, /^login$/i],
      roleHints: ['button'],
      spec: { kind: 'role', role: 'button', name: { source: '^\\s*login\\s*$', flags: 'i' } },
    },
    {
      id: 'orangehrm.loginError',
      description: 'login error message',
      match: [/error\s*(message|banner|alert)?/i, /invalid\s*credentials/i],
      spec: { kind: 'text', text: { source: 'invalid credentials', flags: 'i' } },
    },
    {
      id: 'orangehrm.dashboardHeading',
      description: 'dashboard heading',
      match: [/dashboard\s*(heading|header|title)/i],
      roleHints: ['heading'],
      spec: { kind: 'role', role: 'heading', name: { source: '^\\s*dashboard\\s*$', flags: 'i' } },
    },
    {
      id: 'orangehrm.pimMenu',
      description: 'PIM menu item',
      match: [/\bpim\b\s*(menu|link|module|item|tab)?/i],
      roleHints: ['link'],
      spec: { kind: 'role', role: 'link', name: { source: '^\\s*pim\\s*$', flags: 'i' } },
    },
    {
      id: 'orangehrm.adminMenu',
      description: 'Admin menu item',
      match: [/\badmin\b\s*(menu|link|module|item|tab)/i],
      roleHints: ['link'],
      spec: { kind: 'role', role: 'link', name: { source: '^\\s*admin\\s*$', flags: 'i' } },
    },
    {
      id: 'orangehrm.userDropdown',
      description: 'user profile dropdown',
      match: [/user\s*(profile\s*)?(dropdown|menu)/i, /profile\s*(dropdown|menu)/i],
      spec: { kind: 'css', selector: '.oxd-userdropdown-name' },
    },
    {
      id: 'orangehrm.sidebarSearch',
      description: 'sidebar search box',
      match: [/sidebar\s*search/i, /menu\s*search/i, /search\s*(box|field|input)/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: '^search$', flags: 'i' } },
    },
  ],

  assertionHints: [
    { match: /\bdashboard\s+(page\s+)?(is\s+)?(displayed|shown|loaded|open)/i, action: 'ASSERT_URL', value: '/dashboard' },
    { match: /\b(login|sign[- ]?in)\s+page\s+(is\s+)?(displayed|shown|loaded)/i, action: 'ASSERT_URL', value: '/auth/login' },
    { match: /\b(remains?|stays?)\s+on\s+the\s+(login|sign[- ]?in)\s+page/i, action: 'ASSERT_URL', value: '/auth/login' },
  ],
};
