/**
 * Application definition: car.info.
 *
 * A vehicle-registration lookup site. The interesting feature for automation is
 * the registration search: type a plate, get that vehicle's details.
 *
 * Two things are deliberately absent.
 *
 * Sign-in. The site offers Google OAuth, which is built to resist automation -
 * bot detection, device verification, markup that changes without notice. A
 * test case that drives it would be red for reasons that have nothing to do
 * with this framework, so the catalog describes the Log in link and stops
 * there. Verifying that a signed-out visitor is offered sign-in is a real
 * assertion; completing the sign-in is somebody else's problem.
 *
 * Conditional steps. The original manual document said things like "If it
 * further requests for access, click on Continue". The canonical model has no
 * concept of "maybe", by design: a test that does different things on different
 * runs cannot be asserted about. Such steps have to become either a
 * deterministic precondition or an explicit assertion that the dialog is
 * absent.
 *
 * NOTE: these selectors follow the site's visible structure but have NOT been
 * verified against the live site - car.info was unreachable from the sandbox
 * this was written in. Expect to adjust them on the first real run
 * (`npm run names -- https://car.info` lists the live accessible names); that is what a target catalog is for.
 */

export const carinfo = {
  id: 'carinfo',
  name: 'CarInfo',
  hosts: [/(^|\.)car\.info$/i],
  baseUrl: 'https://car.info',
  /** Wording that binds a test case to this application when no step has a URL. */
  nameHints: [/\bcar\s*\.?\s*info\b/i],

  targets: [
    {
      id: 'carinfo.searchBox',
      description: 'registration number search box',
      match: [
        /registration\s*(number|plate)?\s*(box|input)?/i,
        /search\s*(box|bar|input|field|text\s*box)/i,
        /\bplate\s*(box|number)?\b/i,
      ],
      roleHints: ['textbox'],
      spec: { kind: 'label', text: { source: 'registration number', flags: 'i' } },
    },
    {
      id: 'carinfo.logo',
      description: 'car.info logo',
      match: [/car\s*\.?\s*info\s*logo/i, /\blogo\b/i],
      roleHints: ['link', 'img'],
      spec: { kind: 'role', role: 'link', name: { source: 'car\\.info home', flags: 'i' } },
    },
    {
      id: 'carinfo.loginLink',
      description: 'Log in link',
      match: [/log\s*in\s*(link|button)?/i, /^login$/i, /sign\s*in\s*(link|button)?/i],
      roleHints: ['link'],
      spec: { kind: 'role', role: 'link', name: { source: '^log in$', flags: 'i' } },
    },
    {
      id: 'carinfo.searchResults',
      description: 'vehicle search results',
      match: [/search\s*results?/i, /results?\s*(list|page|section|area)/i, /vehicle\s*results?/i],
      spec: { kind: 'css', selector: '.vehicle-results' },
    },
    {
      id: 'carinfo.vehicleTitle',
      description: 'vehicle title heading',
      match: [/vehicle\s*(title|heading|name)/i, /title\s*of\s*the\s*vehicle/i],
      roleHints: ['heading'],
      spec: { kind: 'css', selector: 'h1.vehicle-heading' },
    },
    {
      id: 'carinfo.vehicleDetails',
      description: 'vehicle details card',
      match: [/vehicle\s*(details?|info(rmation)?|card)/i, /\bdetails?\s*(card|panel|section)?\b/i],
      spec: { kind: 'css', selector: '.vehicle-card' },
    },
  ],

  /**
   * Domain shorthands. A manual tester writes "the vehicle page is displayed";
   * only someone who knows the site knows that means the /search path.
   */
  assertionHints: [
    {
      match: /\bvehicle\s+(page|result\s+page)\s+(is\s+)?(displayed|shown|loaded|open)/i,
      action: 'ASSERT_URL',
      // car.info searches with a query parameter on the root path, not a
      // separate results path: car.info/?s=KFG40L
      value: '?s=',
    },
    {
      match: /\b(home\s*page|homepage)\s+(is\s+)?(displayed|shown|loaded)/i,
      action: 'ASSERT_TITLE',
      value: 'car.info',
    },
    {
      match: /\bvehicle\s+(details?|info(rmation)?)\s+(are|is)\s+(displayed|shown)/i,
      action: 'ASSERT_VISIBLE',
      target: 'vehicle details card',
    },
  ],
};
