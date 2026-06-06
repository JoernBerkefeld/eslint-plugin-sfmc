/**
 * ESLint config for per-rule test fixtures.
 * Uses the strict config so every rule is active at maximum severity.
 * The strict config already includes processors for .amp, .ssjs, and .html files.
 * Import directly from local source — no npm install needed.
 */
import sfmc from '../../src/index.js';

export default [...sfmc.configs.strict];
