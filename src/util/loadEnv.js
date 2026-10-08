/**
 * Loads the project's .env into process.env, if one exists.
 *
 * The README asks you to copy .env.example to .env, so something has to read
 * it. Node has done this natively since 20.12, which keeps the project free of
 * a dotenv dependency; on anything older .env is simply ignored and every
 * variable has to come from the shell.
 *
 * Values already present in the environment win: an `ANTHROPIC_API_KEY=... npm
 * run generate` or a `$env:PW_CHANNEL` set for one shell still overrides the
 * file, which is what makes .env a default rather than a mandate.
 */
export function loadProjectEnv(file = '.env') {
  if (typeof process.loadEnvFile !== 'function') return false;
  try {
    process.loadEnvFile(file);
    return true;
  } catch {
    // No .env, or it is unreadable. Both are normal - the shell supplies the
    // variables instead.
    return false;
  }
}
