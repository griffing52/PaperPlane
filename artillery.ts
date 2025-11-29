import { type Config, type Scenario } from 'artillery';
import { type Page } from '@playwright/test'

const URL = "localhost:3000";
const EMAIL = "michael.smith@outlook.com";
const PASSWORD = "123456";

export const config: Config = {
  target: URL,
  engines: {
    playwright: {
      // Enable Playwright trace recording
      // Requires an Artillery Cloud account for viewing traces:
      // https://www.artillery.io/docs/get-started/get-artillery#set-up-cloud-reporting
      trace: {
        enabled: true
      }
    }
  },
  phases: [
    {
      duration: "1m",
      arrivalRate: 2,
    },
    {
      duration: "5m",
      arrivalRate: 2,
    },
    {
      duration: "1m",
      arrivalRate: 5,
    },
    {
      duration: "5m",
      arrivalRate: 5,
    },
    {
      duration: "1m",
      arrivalRate: 10,
    },
    {
      duration: "5m",
      arrivalRate: 10,
    },
  ],
};

export const scenarios: Scenario[] = [{
  engine: 'playwright',
  testFunction: testFlightEntry
}];

async function testFlightEntry(page: Page) {
  await page.goto(`${URL}/login`);
  await page.fill('[data-testid="login-email"]', EMAIL);
  await page.fill('[data-testid="login-password"]', PASSWORD);
  await page.goto(`${URL}/dashboard`);
  await page.click('[data-testid="logout-button"]');
}
