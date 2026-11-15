const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/fab3d',
  testMatch: '*.spec.cjs',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/fab-browser-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      ...(process.env.FAB_CHROMIUM_PATH ? { executablePath: process.env.FAB_CHROMIUM_PATH } : {}),
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-webgl'],
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview:fab',
    url: 'http://127.0.0.1:4173/ale-v092-fab-preview.html',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
