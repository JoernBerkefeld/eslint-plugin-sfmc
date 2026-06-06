/**
 * ESLint config for manual testing of eslint-plugin-sfmc in MCN (Marketing Cloud Next) mode.
 * Imports directly from the local source — no npm install needed.
 * Open any file in this folder in VS Code to see live diagnostics from the plugin.
 */
import sfmc from '../../src/index.js';

export default [
    // Standalone .amp and .ssjs files — MCN mode
    ...sfmc.configs['recommended-next'],
    // Embedded AMPscript / SSJS inside .html files — MCN mode
    ...sfmc.configs['embedded-next'],
];
