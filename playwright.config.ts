import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30000,
  use: {
    headless: false, 
    baseURL: "http://localhost:3000",
    trace: 'on-first-retry',
  },
});
