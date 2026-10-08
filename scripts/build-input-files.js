/**
 * Regenerates the sample manual test case documents in input/.
 *
 * The .xlsx and .docx files are committed so the repository can be cloned and
 * demoed immediately; this script is what produced them.
 *
 *   npm run build:inputs
 */

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const OUTPUT_DIR = 'input';

/** The manual test cases, exactly as a manual tester would have written them. */
export const TEST_CASES = [
  {
    id: 'TC-YT-001',
    title: 'Search for a video on YouTube',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
    ],
  },
  {
    id: 'TC-YT-002',
    title: 'Verify YouTube homepage',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Verify that the YouTube logo is visible', expected: 'The logo is shown in the header' },
      { text: 'Verify that the search box is visible', expected: 'The search box is shown in the header' },
      { text: 'Verify that the page title contains "YouTube"', expected: 'Browser tab reads YouTube' },
    ],
  },
  {
    id: 'TC-YT-003',
    title: 'Search and open a video',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright testing tutorial" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video player is visible', expected: 'The player is rendered' },
      { text: 'Verify that the page title contains "YouTube"', expected: 'Browser tab reads YouTube' },
    ],
  },
  {
    id: 'TC-YT-004',
    title: 'Search, open a video and go back to the results',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
      { text: 'Navigate back', expected: 'The browser returns to the search results' },
      { text: 'Verify that the URL contains "/results"', expected: 'The search results page is shown again' },
    ],
  },
  {
    id: 'TC-YT-005',
    title: 'Search results match the query',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Verify that the search results list contains "Playwright"', expected: 'Results mention the query' },
      { text: 'Verify that the page title contains "Playwright automation"', expected: 'Tab shows the query' },
    ],
  },
  {
    id: 'TC-YT-006',
    title: 'Open a video and verify its details',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
      { text: 'Verify that the video player is visible', expected: 'The player is rendered' },
      { text: 'Verify that the video title contains "Playwright"', expected: 'The heading names the video' },
    ],
  },
  {
    id: 'TC-YT-007',
    title: 'Return to the homepage using the logo',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search results are displayed' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Click the YouTube logo', expected: 'The browser returns to the homepage' },
      { text: 'Verify that the page title contains "YouTube"', expected: 'Tab reads YouTube' },
      { text: 'Verify that the search box is visible', expected: 'The search box is shown in the header' },
    ],
  },
  {
    id: 'TC-YT-008',
    title: 'Search results mention a named alternative',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright vs Selenium" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Verify that the search results list contains "Selenium"', expected: 'A result names Selenium' },
    ],
  },
  {
    id: 'TC-YT-009',
    title: 'Going back from a video restores the results list',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video player is visible', expected: 'The player is rendered' },
      { text: 'Navigate back', expected: 'The browser returns to the search results' },
      { text: 'Verify that search results are displayed', expected: 'The results list is shown again' },
    ],
  },
  {
    id: 'TC-YT-010',
    title: 'The homepage shows no video player',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Verify that the YouTube logo is visible', expected: 'The logo is shown in the header' },
      { text: 'Verify that the video player is not visible', expected: 'No player is rendered on the homepage' },
    ],
  },
  {
    id: 'TC-YT-011',
    title: 'Refine a search from the results page',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
      { text: 'Enter "Playwright vs Selenium" in the search box', expected: 'The query is replaced' },
      { text: 'Click the Search button', expected: 'The new search is submitted' },
      { text: 'Verify that the page title contains "Playwright vs Selenium"', expected: 'Tab shows the new query' },
    ],
  },
  {
    id: 'TC-YT-012',
    title: 'Open a video then return to the homepage',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright testing tutorial" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
      { text: 'Click the YouTube logo', expected: 'The browser returns to the homepage' },
      { text: 'Verify that the search box is visible', expected: 'The search box is shown in the header' },
      { text: 'Verify that the video player is not visible', expected: 'The player is gone' },
    ],
  },

  // ---------------------------------------------------------------------------
  // TC-YT-013 onwards.
  //
  // These arrived as one-line scenario summaries - "Open YouTube, enter a
  // search term, submit" - and none could be automated as written. That is not
  // the framework being pedantic: a one-line scenario cannot be executed
  // consistently by a human either. "A search term" does not say which, so two
  // testers do two different things, and not one of them stated an expected
  // result, so no run could be judged right or wrong.
  //
  // Each is rewritten under three rules:
  //
  //   one action per step   - a failure names the step that failed, and the
  //                           report shows the page at that moment;
  //   a concrete value      - two runs do the same thing;
  //   at least one "Verify" - the test is able to fail.
  //
  // The originals, for the record:
  //
  //   013 Open YouTube, enter a search term, submit
  //   014 Search for a unique, unlikely phrase
  //   015 Enter a query, clear the search field
  //   016 Enter a query and press Enter
  //   017 Enter a query and click Search
  //   018 Search for a video and select a result
  //   019 Open a video
  //   020 Open a playable video, click Play, then Pause
  //   021 Open a video and change the volume
  //   022 Click the mute control twice
  //   023 Enter and exit full-screen mode
  //   024 Open a video and expand its description
  //   025 Click the creator's channel name
  //   026 Scroll to comments on a video
  //   027 Click Like while signed in
  //   028 Click Subscribe while signed in
  //   029 Navigate to the homepage
  //   030 Open a result in a new tab            <- omitted, see below
  //   031 Open a video from search, then go Back
  //   032 Go Back, then Forward
  //
  // TC-YT-030 is deliberately absent. A second tab means a popup and a second
  // page object, and the canonical model has no way to express that - a test
  // case is a sequence of steps against one page. Leaving it out is honest;
  // rewriting it into something it is not would not be.
  //
  // 027 and 028 changed meaning, not just shape. "Click Like while signed in"
  // cannot run, because YouTube blocks automated sign-in. What a signed-out
  // visitor sees when they click Like is real behaviour and worth asserting,
  // so that is what they check.
  // ---------------------------------------------------------------------------
  {
    id: 'TC-YT-013',
    title: 'Search for a video',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
    ],
  },
  {
    id: 'TC-YT-014',
    title: 'Search with no results',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "zzqqxx no such video" in the search box', expected: 'The unlikely phrase is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Verify that the no results message is visible', expected: 'The empty state is shown' },
      { text: 'Verify that the first search result is not visible', expected: 'No videos are listed' },
    ],
  },
  {
    id: 'TC-YT-015',
    title: 'Clear search text',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Clear the search box', expected: 'The field is emptied' },
      { text: 'Verify that the search box is visible', expected: 'The field is still there, now empty' },
    ],
  },
  {
    id: 'TC-YT-016',
    title: 'Search using Enter',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Verify that the URL contains "/results"', expected: 'The results page is shown' },
      { text: 'Verify that search results are displayed', expected: 'A list of matching videos is shown' },
    ],
  },
  {
    id: 'TC-YT-017',
    title: 'Search using the search button',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Click the Search button', expected: 'Search is submitted' },
      { text: 'Verify that the URL contains "/results"', expected: 'The results page is shown' },
    ],
  },
  {
    id: 'TC-YT-018',
    title: 'Open a video',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
      { text: 'Verify that the video player is visible', expected: 'The player is rendered' },
    ],
  },
  {
    id: 'TC-YT-019',
    title: 'Verify video title',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video title contains "Playwright"', expected: 'The heading names the video' },
    ],
  },
  {
    id: 'TC-YT-020',
    title: 'Play and pause a video',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Click the Play button', expected: 'Playback starts' },
      { text: 'Verify that the Play button contains "Pause"', expected: 'The control now offers Pause' },
      { text: 'Click the Play button', expected: 'Playback stops' },
      { text: 'Verify that the Play button contains "Play"', expected: 'The control offers Play again' },
    ],
  },
  {
    id: 'TC-YT-021',
    title: 'Adjust volume',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the volume slider is visible', expected: 'The volume control is shown' },
      { text: 'Enter "40" in the volume slider', expected: 'The volume is lowered' },
    ],
  },
  {
    id: 'TC-YT-022',
    title: 'Toggle mute',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Click the Mute button', expected: 'Audio is muted' },
      { text: 'Verify that the Mute button contains "Unmute"', expected: 'The control now offers Unmute' },
      { text: 'Click the Mute button', expected: 'Audio is restored' },
      { text: 'Verify that the Mute button contains "Mute"', expected: 'The control offers Mute again' },
    ],
  },
  {
    id: 'TC-YT-023',
    title: 'Toggle full screen',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Click the Full screen button', expected: 'The player fills the window' },
      { text: 'Verify that the video player is visible', expected: 'The player is still rendered' },
    ],
  },
  {
    id: 'TC-YT-024',
    title: 'Expand video description',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the expanded description is not visible', expected: 'The description starts collapsed' },
      { text: 'Click the Show more button', expected: 'The description expands' },
      { text: 'Verify that the expanded description is visible', expected: 'The rest of the description is shown' },
    ],
  },
  {
    id: 'TC-YT-025',
    title: 'Open channel from a video',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Click the channel name link', expected: 'The channel page opens' },
      { text: 'Verify that the URL contains "/channel"', expected: 'The channel page is shown' },
      { text: 'Verify that the channel page heading is visible', expected: 'The channel is named' },
    ],
  },
  {
    id: 'TC-YT-026',
    title: 'Open the Comments section',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the Comments section is visible', expected: 'Comments are shown' },
    ],
  },
  {
    id: 'TC-YT-027',
    title: 'Liking a video while signed out asks for sign-in',
    preconditions: ['User has internet access.', 'User is not signed in.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the sign-in prompt is not visible', expected: 'Nothing is asked yet' },
      { text: 'Click the Like button', expected: 'Sign-in is requested' },
      { text: 'Verify that the sign-in prompt is visible', expected: 'The viewer is asked to sign in' },
    ],
  },
  {
    id: 'TC-YT-028',
    title: 'Subscribing while signed out asks for sign-in',
    preconditions: ['User has internet access.', 'User is not signed in.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the Subscribe button is visible', expected: 'Subscribing is offered' },
      { text: 'Click the Subscribe button', expected: 'Sign-in is requested' },
      { text: 'Verify that the sign-in prompt is visible', expected: 'The viewer is asked to sign in' },
    ],
  },
  {
    id: 'TC-YT-029',
    title: 'Open the YouTube homepage',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Verify that the page title contains "YouTube"', expected: 'Browser tab reads YouTube' },
      { text: 'Verify that the YouTube logo is visible', expected: 'The logo is shown in the header' },
      { text: 'Verify that the search box is visible', expected: 'The search box is shown in the header' },
    ],
  },
  {
    id: 'TC-YT-031',
    title: 'Browser Back navigation',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
      { text: 'Navigate back', expected: 'The browser returns to the search results' },
      { text: 'Verify that the URL contains "/results"', expected: 'The results page is shown again' },
    ],
  },
  {
    id: 'TC-YT-032',
    title: 'Browser Forward navigation',
    preconditions: ['User has internet access.'],
    steps: [
      { text: 'Open https://www.youtube.com', expected: 'YouTube homepage is displayed' },
      { text: 'Close the cookie consent dialog if it is displayed', expected: 'The page is not covered by the consent dialog' },
      { text: 'Enter "Playwright automation" in the search box', expected: 'Search text is entered' },
      { text: 'Press Enter', expected: 'Search is submitted' },
      { text: 'Click the first search result', expected: 'The video opens' },
      { text: 'Navigate back', expected: 'The browser returns to the search results' },
      { text: 'Verify that the URL contains "/results"', expected: 'The results page is shown' },
      { text: 'Navigate forward', expected: 'The browser returns to the video' },
      { text: 'Verify that the video page is displayed', expected: 'The URL contains /watch' },
    ],
  },
];

async function buildExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'playwright-test-generator';
  const sheet = workbook.addWorksheet('ManualTestCases');

  sheet.columns = [
    { header: 'TestCaseID', key: 'id', width: 14 },
    { header: 'Title', key: 'title', width: 34 },
    { header: 'Preconditions', key: 'preconditions', width: 26 },
    { header: 'Step', key: 'step', width: 52 },
    { header: 'ExpectedResult', key: 'expected', width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (const testCase of TEST_CASES) {
    for (const step of testCase.steps) {
      sheet.addRow({
        id: testCase.id,
        title: testCase.title,
        preconditions: testCase.preconditions.join(' '),
        step: step.text,
        expected: step.expected,
      });
    }
  }

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

async function buildWord(filePath) {
  const children = [
    new Paragraph({
      text: 'YouTube - Manual Test Cases',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
    }),
  ];

  for (const testCase of TEST_CASES) {
    children.push(
      new Paragraph({ text: '' }),
      new Paragraph({ children: [new TextRun({ text: `Test Case ID: ${testCase.id}`, bold: true })] }),
      new Paragraph({ text: `Title: ${testCase.title}` }),
      new Paragraph({ text: `Precondition: ${testCase.preconditions.join(' ')}` }),
      new Paragraph({ text: 'Steps:' }),
    );
    testCase.steps.forEach((step, index) => {
      children.push(new Paragraph({ text: `${index + 1}. ${step.text}` }));
      if (step.expected) children.push(new Paragraph({ text: `Expected: ${step.expected}` }));
    });
  }

  const document = new Document({ sections: [{ children }] });
  fs.writeFileSync(filePath, await Packer.toBuffer(document));
  return filePath;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const excelPath = await buildExcel(path.join(OUTPUT_DIR, 'youtube-tests.xlsx'));
const wordPath = await buildWord(path.join(OUTPUT_DIR, 'youtube-tests.docx'));
console.log(`Wrote ${excelPath}`);
console.log(`Wrote ${wordPath}`);
