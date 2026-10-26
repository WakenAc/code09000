import { defineConfig } from '@playwright/test';

const PORTA = 4173;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    browserName: 'chromium',
  },
  webServer: {
    command: 'node scripts/servidor.mjs',
    url: `http://127.0.0.1:${PORTA}/`,
    env: { PORT: String(PORTA) },
    reuseExistingServer: !process.env.CI,
  },
});
