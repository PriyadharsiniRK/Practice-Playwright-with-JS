/**
 * Application definition: SauceDemo (saucedemo.com).
 *
 * The usual shape - hostnames, element catalog, assertion shorthands - plus two
 * declarations the other applications did not need:
 *
 *   dataEntry   wording for a value that is not written in quotes, because this
 *               site's manual test cases say `Enter username standard_user`
 *               rather than `Enter "standard_user" in the username field`.
 *   stepHints   wording whose verb does not name the action it performs, e.g.
 *               `Add Sauce Labs Backpack to cart` is a click, not data entry.
 *
 * Both are data, not logic: the analyzer consults them, the application decides
 * what they say.
 */

export const saucedemo = {
  id: 'saucedemo',
  name: 'SauceDemo',
  hosts: [/(^|\.)saucedemo\.com$/i],
  baseUrl: 'https://www.saucedemo.com',
  /** Port the offline stand-in listens on (see mock/saucedemo.js). */
  offlinePort: 4175,
  /**
   * Wording that binds a test case to this application when no step carries a
   * URL - a manual tester writes "User is on SauceDemo login page" instead.
   */
  nameHints: [/\bsauce\s*demo\b/i, /\bsauce\s+labs\b/i],

  targets: [
    {
      id: 'saucedemo.username',
      description: 'username field',
      match: [/user\s*name/i, /\busername\s*(box|field|input)?\b/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: '^Username$', flags: 'i' } },
    },
    {
      id: 'saucedemo.password',
      description: 'password field',
      match: [/\bpassword\b/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: '^Password$', flags: 'i' } },
    },
    {
      id: 'saucedemo.loginButton',
      description: 'Login button',
      match: [/log\s*in\s*(button)?/i, /^login$/i, /sign\s*in\s*(button)?/i],
      roleHints: ['button'],
      spec: { kind: 'role', role: 'button', name: { source: '^login$', flags: 'i' } },
    },
    {
      id: 'saucedemo.productsHeading',
      description: 'Products heading on the inventory page',
      match: [/products?\s*(heading|title|header)/i, /^products$/i],
      roleHints: ['heading'],
      spec: { kind: 'role', role: 'heading', name: { source: '^products$', flags: 'i' } },
    },
    {
      id: 'saucedemo.loginError',
      description: 'login error message banner',
      match: [/login\s*error/i, /error\s*(message|banner|text)/i, /\berror\b/i],
      spec: { kind: 'css', selector: '[data-test="error"]' },
    },
    {
      id: 'saucedemo.backpackLink',
      description: 'Sauce Labs Backpack product name',
      match: [/sauce\s*labs\s*backpack/i, /\bbackpack\b/i],
      roleHints: ['link', 'text'],
      spec: { kind: 'text', text: { source: '^Sauce Labs Backpack$', flags: '' } },
    },
    {
      id: 'saucedemo.addBackpackToCart',
      description: 'Add to cart button for the Sauce Labs Backpack',
      match: [/add\s*to\s*cart/i, /\badd\b.*\bcart\b/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: '[data-test="add-to-cart-sauce-labs-backpack"]' },
    },
    {
      id: 'saucedemo.removeBackpackFromCart',
      description: 'Remove button for the Sauce Labs Backpack',
      match: [/\bremove\b/i, /remove\s*(button)?\s*(for)?\s*backpack/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: '[data-test="remove-sauce-labs-backpack"]' },
    },
    {
      id: 'saucedemo.cartLink',
      description: 'shopping cart link',
      match: [/shopping\s*cart/i, /cart\s*(link|icon|button|page)/i, /^cart$/i],
      roleHints: ['link'],
      spec: { kind: 'css', selector: '.shopping_cart_link' },
    },
    {
      id: 'saucedemo.checkoutButton',
      description: 'Checkout button',
      match: [/checkout\s*(button)?/i, /^checkout$/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: '[data-test="checkout"]' },
    },
    {
      id: 'saucedemo.firstName',
      description: 'First Name field on the checkout form',
      match: [/first\s*name/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: '^First Name$', flags: 'i' } },
    },
    {
      id: 'saucedemo.lastName',
      description: 'Last Name field on the checkout form',
      match: [/last\s*name/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: '^Last Name$', flags: 'i' } },
    },
    {
      id: 'saucedemo.postalCode',
      description: 'Zip/Postal Code field on the checkout form',
      match: [/post(al)?\s*code/i, /\bzip\s*code\b/i, /\bzip\b/i],
      roleHints: ['textbox'],
      spec: { kind: 'placeholder', text: { source: 'Postal Code', flags: 'i' } },
    },
    {
      id: 'saucedemo.continueButton',
      description: 'Continue button on the checkout form',
      match: [/continue\s*(button)?/i, /^continue$/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: '[data-test="continue"]' },
    },
    {
      id: 'saucedemo.finishButton',
      description: 'Finish button on the checkout overview',
      match: [/finish\s*(button)?/i, /^finish$/i],
      roleHints: ['button'],
      spec: { kind: 'css', selector: '[data-test="finish"]' },
    },
    {
      id: 'saucedemo.confirmationMessage',
      description: 'order confirmation message',
      match: [/confirmation\s*(message|text|banner)?/i, /thank\s*you/i, /order\s*complete/i],
      spec: { kind: 'css', selector: '.complete-header' },
    },
    {
      id: 'saucedemo.sortDropdown',
      description: 'product sorting dropdown',
      match: [/sort(ing)?\s*(dropdown|drop\s*down|select|combo\s*box|box)?/i, /product\s*sort/i],
      roleHints: ['combobox'],
      spec: { kind: 'css', selector: '[data-test="product_sort_container"]' },
    },
    {
      id: 'saucedemo.firstProductPrice',
      description: 'price of the first product in the list',
      match: [/first\s*product\s*price/i, /price\s*of\s*the\s*first\s*product/i, /first\s*price/i],
      spec: { kind: 'css', selector: '.inventory_item_price', nth: 'first' },
    },
  ],

  /**
   * Values a step refers to without quoting. `value` supplies test data the
   * manual test case never states - the checkout form only requires the fields
   * to be non-empty, so the exact strings are arbitrary, but they are declared
   * here rather than invented inside the analyzer.
   */
  dataEntry: [
    { match: /^user\s*name\s+(?<value>\S+)/i, target: 'username field' },
    { match: /^password\s+(?<value>\S+)/i, target: 'password field' },
    { match: /^invalid\s+password\b/i, target: 'password field', value: 'wrong_password' },
    { match: /^first\s*name\b/i, target: 'First Name field', value: 'John' },
    { match: /^last\s*name\b/i, target: 'Last Name field', value: 'Doe' },
    { match: /^post(al)?\s*code\b/i, target: 'Postal Code field', value: '12345' },
  ],

  /**
   * What a stated precondition means in actions. A manual test case says "User
   * is logged in" and writes no step for it; an automated run has to do it.
   * Most specific first - "logged in" implies reaching the login page.
   */
  preconditionHints: [
    {
      match: /\blogged\s*in\b/i,
      steps: [
        { action: 'NAVIGATE', value: 'https://www.saucedemo.com' },
        { action: 'FILL', target: 'username field', value: 'standard_user' },
        { action: 'FILL', target: 'password field', value: 'secret_sauce' },
        { action: 'CLICK', target: 'Login button' },
      ],
    },
    {
      match: /\blogin\s+page\b/i,
      steps: [{ action: 'NAVIGATE', value: 'https://www.saucedemo.com' }],
    },
  ],

  /** Wording whose verb does not name the action the step performs. */
  stepHints: [
    { match: /^add\b.*\bto\s+cart$/i, action: 'CLICK', target: 'Add to cart button' },
    { match: /^select\s+price\s+low\s+to\s+high$/i, action: 'SELECT', target: 'product sorting dropdown', value: 'Price (low to high)' },
  ],

  /**
   * Domain shorthands. A manual tester writes "Products page is displayed";
   * only someone who knows SauceDemo knows that means /inventory.html.
   */
  assertionHints: [
    { match: /\bproducts?\s+page\s+(is\s+)?(displayed|shown|loaded|open)/i, action: 'ASSERT_URL', value: '/inventory.html' },
    { match: /\b(shopping\s+)?cart\s+page\s+(is\s+)?(displayed|shown|loaded|open)/i, action: 'ASSERT_URL', value: '/cart.html' },
    { match: /\bcheckout\s+information\s+page\s+(is\s+)?(displayed|shown|loaded)/i, action: 'ASSERT_URL', value: '/checkout-step-one.html' },
    { match: /\bcheckout\s+overview\s+(page\s+)?(is\s+)?(displayed|shown|loaded)/i, action: 'ASSERT_URL', value: '/checkout-step-two.html' },
    { match: /\blowest[- ]priced\s+product\s+is\s+displayed\s+first/i, action: 'ASSERT_TEXT', target: 'first product price', value: '$7.99' },
    { match: /\bproducts?\s+are\s+sorted\s+by\s+price\s+ascending/i, action: 'ASSERT_TEXT', target: 'first product price', value: '$7.99' },
    { match: /\border\s+is\s+completed\b/i, action: 'ASSERT_TEXT', target: 'order confirmation message', value: 'Thank you for your order' },
    // "the confirmation message is displayed" must check what it says, not just
    // that the element exists - otherwise a failed order still passes.
    { match: /\border\s+confirmation\s+message\s+is\s+displayed\b/i, action: 'ASSERT_TEXT', target: 'order confirmation message', value: 'Thank you for your order' },
  ],
};
