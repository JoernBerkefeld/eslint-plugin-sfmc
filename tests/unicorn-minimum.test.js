import { fileURLToPath } from 'node:url';

// Run the same composition contract with the exact, separately installed minimum.
process.env.SFMC_TEST_ESLINT_PATH = fileURLToPath(import.meta.resolve('eslint-minimum'));
process.env.SFMC_TEST_ESLINT_VERSION = '10.4.0';
await import('./unicorn-configs.test.js');
