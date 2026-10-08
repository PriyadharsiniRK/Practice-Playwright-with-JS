/** Minimal console formatting for the CLI. */

const ESC = String.fromCharCode(27);
const supportsColor = process.stdout.isTTY && process.env.NO_COLOR == null;
const paint = (code, text) => (supportsColor ? `${ESC}[${code}m${text}${ESC}[0m` : text);

export const logger = {
  heading: (text) => console.log(`\n${paint('1', text)}`),
  step: (text) => console.log(`${paint('32', '✓')} ${text}`),
  warn: (text) => console.log(`${paint('33', '⚠')} ${text}`),
  error: (text) => console.error(`${paint('31', '✗')} ${text}`),
  info: (text) => console.log(text),
  blank: () => console.log(''),
};
