// ESLint: `npm run lint` (CI runs it). The bundle is plain browser scripts sharing the CA
// namespace and the game's globals; tests and the build script are Node modules.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        CA: 'writable',
        // the game's globals
        Game: 'readonly',
        Beautify: 'readonly',
        PlaySound: 'readonly',
        Steam: 'readonly',
        shuffle: 'readonly',
        l: 'readonly',
        CookieMonsterData: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // the userscript loader (Tampermonkey / Greasemonkey)
    files: ['CookieMgr.user.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, unsafeWindow: 'readonly' } },
  },
  {
    files: ['tests/**/*.mjs', 'build.mjs', 'eslint.config.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] },
  },
];
