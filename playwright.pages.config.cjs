const { defineConfig } = require('@playwright/test');
const fab = require('./playwright.fab.config.cjs');

module.exports = defineConfig({
  ...fab,
  testDir: './tests/pages',
  testMatch: '*.spec.cjs',
  reporter: [['list'], ['json', { outputFile: 'test-results/pages-browser-results.json' }]],
  use: { ...fab.use, baseURL: 'http://127.0.0.1:4174' },
  webServer: {
    command: 'python3 -m http.server 4174 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: false,
    timeout: 30000,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
