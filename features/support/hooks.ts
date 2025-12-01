import { Before, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page } from '@playwright/test';
import { CustomWorld } from './custom-world';
import fs from 'fs';
import path from 'path';

let browser: Browser;
setDefaultTimeout(60 * 1000);

const BASE_URL = 'http://localhost:3000'; // Change to your app URL
const TEST_USER = { email: 'admin@example.com', password: 'Password123!' }; // Change to valid creds

BeforeAll(async function () {
  browser = await chromium.launch({ headless: false }); // Set true for CI
});

Before(async function (this: CustomWorld, scenario) {
  // 2. SETUP PATHS
  const isCleanSlate = scenario.pickle.tags.some(tag => tag.name === '@clean');
  const workerId = process.env.CUCUMBER_WORKER_ID || '0';
  
  // Ensure the folder exists
  const authDir = path.resolve('./playwright/.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  
  const authFile = path.join(authDir, `worker_${workerId}.json`);

  // 3. DECIDE CONTEXT TYPE
  if (isCleanSlate) {
    // Option A: Clean Slate (No cookies)
    console.log(`Creating Clean Context for: ${scenario.pickle.name}`);
    this.context = await browser.newContext({ baseURL: BASE_URL });

  } else {
    // Option B: Authenticated Context
    
    // --- THE SELF-HEALING LOGIC ---
    if (!fs.existsSync(authFile)) {
      console.log(`Auth file missing for Worker ${workerId}. Logging in now...`);
      // Call the helper function below to generate the file
      await createAuthFile(authFile);
    }
    // ------------------------------

    console.log(`Creating Auth Context for: ${scenario.pickle.name}`);
    this.context = await browser.newContext({ 
      storageState: authFile, // Load the file we just verified/created
      baseURL: BASE_URL 
    });
  }

  this.page = await this.context.newPage();
});

AfterAll(async function () {
  await browser.close();
});

// =========================================
// HELPER: The "Robot" that creates the file
// =========================================
async function createAuthFile(filePath: string) {
  // 1. Open a temporary page
  const page = await browser.newPage({ baseURL: BASE_URL });

  try {
    console.log(`   Navigating to login...`);
    await page.goto('/login');
    
    console.log(`   Filling credentials...`);
    await page.fill('input[name="login-email"]', TEST_USER.email); 
    await page.fill('input[name="login-password"]', TEST_USER.password);
    await page.click('button[type="login-submit"]');

    // 3. Wait for success
    // Crucial: Wait until we are redirected to the dashboard (cookies are set)
    await page.waitForURL('**/dashboard'); 

    // 4. Save the file
    await page.context().storageState({ path: filePath });
    console.log(`Auth state saved to: ${filePath}`);

  } catch (error) {
    console.error("FAILED to create auth file. Is the login page working?");
    throw error;
  } finally {
    await page.close();
  }
}