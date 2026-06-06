/**
 * ESLint config for manual testing of eslint-plugin-sfmc in MCE (Engagement) mode.
 * Imports directly from the local source — no npm install needed.
 * Open any file in this folder in VS Code to see live diagnostics from the plugin.
 */
import sfmc from '../src/index.js';

export default [
    // Standalone .amp and .ssjs files
    ...sfmc.configs.recommended,
    // Embedded AMPscript / SSJS inside .html files
    ...sfmc.configs.embedded,
];
