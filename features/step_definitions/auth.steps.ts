import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/custom-world";

// Note: setDefaultTimeout is removed here because we moved it to hooks.ts

// -------------------------------
// Helper: store last password/email for steps
// -------------------------------
Given("I am on the sign-up page", async function (this: CustomWorld) {
  await this.page.goto("/signup");
});

// -------------------------------
// Scenario: User successfully signs up with valid credentials
// -------------------------------
When(
  "I enter a valid email {string} and a valid password {string}",
  async function (this: CustomWorld, email: string, password: string) {
    // FIX: To avoid "User already exists" on repeated runs, we randomize the email
    // if the input string is a generic test email.
    const uniqueEmail = email.includes("@") 
      ? `test-${Date.now()}-${email}` 
      : email;

    this.existingEmail = uniqueEmail; // Store for later if needed
    this.lastPassword = password;

    await this.page.fill('[data-testid="signup-email"]', uniqueEmail);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

When("I enter the same password to confirm it", async function (this: CustomWorld) {
  // We explicitly check lastPassword exists to satisfy TypeScript
  if (!this.lastPassword) throw new Error("No previous password set");
  await this.page.fill('[data-testid="signup-confirm"]', this.lastPassword);
});

When("I submit the sign-up form", async function (this: CustomWorld) {
  await this.page.click('[data-testid="signup-button"]');
});

Then("I should be redirected to the dashboard page", async function (this: CustomWorld) {
  // Cucumber waits up to 60s (from hooks.ts), so we give Playwright 10s here
  await this.page.waitForURL("**/dashboard", { timeout: 10000 });
  expect(this.page.url()).toContain("/dashboard");
});

// -------------------------------
// Scenario: User cannot sign up with an email that already exists
// -------------------------------
Given("a user already exists with email {string}", async function (this: CustomWorld, email: string) {
  // In a real app, you might query the DB here or API to ensure user exists.
  // For UI tests, we just assume the environment is seeded or we reuse a known email.
  this.existingEmail = email;
});

When("I attempt to sign up with email {string}", async function (this: CustomWorld, email: string) {
  await this.page.fill('[data-testid="signup-email"]', email);
  await this.page.fill('[data-testid="signup-password"]', "Password123!");
  await this.page.fill('[data-testid="signup-confirm"]', "Password123!");
  await this.page.click('[data-testid="signup-button"]');
});

Then(
  "I should see a message indicating the email is already in use",
  async function (this: CustomWorld) {
    const errorLocator = this.page.locator('[data-testid="signup-error"]');
    await expect(errorLocator).toBeVisible();
  }
);

// -------------------------------
// Scenario: User cannot sign up with a weak password
// -------------------------------
When(
  "I enter an email {string} and a weak password {string}",
  async function (this: CustomWorld, email: string, password: string) {
    // Randomize email to avoid "User Exists" error masking the "Weak Password" error
    const uniqueEmail = `weak-${Date.now()}@test.com`;
    
    this.lastPassword = password;
    await this.page.fill('[data-testid="signup-email"]', uniqueEmail);
    await this.page.fill('[data-testid="signup-password"]', password);
    await this.page.fill('[data-testid="signup-confirm"]', password);
    await this.page.click('[data-testid="signup-button"]');
  }
);

Then("I should see an error", async function (this: CustomWorld) {
  const errorLocator = this.page.locator('[data-testid="signup-error"]');
  await expect(errorLocator).toBeVisible();
});

// -------------------------------
// Scenario: User cannot sign up with an invalid email format
// -------------------------------
When("I enter an invalid email {string}", async function (this: CustomWorld, email: string) {
  this.lastPassword = "ValidPass123!";
  await this.page.fill('[data-testid="signup-email"]', email);
  await this.page.fill('[data-testid="signup-password"]', this.lastPassword);
  await this.page.fill('[data-testid="signup-confirm"]', this.lastPassword);
  await this.page.click('[data-testid="signup-button"]');
});

// -------------------------------
// Scenario: Sign-up button is disabled until form is valid
// -------------------------------
When("I have not completed valid input", async function (this: CustomWorld) {
  await this.page.fill('[data-testid="signup-email"]', "");
  await this.page.fill('[data-testid="signup-password"]', "");
  await this.page.fill('[data-testid="signup-confirm"]', "");
});

Then('the "Sign Up" button should remain disabled', async function (this: CustomWorld) {
  const btn = this.page.locator('[data-testid="signup-button"]');
  await expect(btn).toBeDisabled();
});

// -------------------------------
// Scenario: User cannot sign up without confirming password correctly
// -------------------------------
When(
  "I enter an email {string} and a valid password {string}",
  async function (this: CustomWorld, email: string, password: string) {
    const uniqueEmail = `mismatch-${Date.now()}@test.com`;
    this.lastPassword = password;
    await this.page.fill('[data-testid="signup-email"]', uniqueEmail);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

When("I enter a password that is not the valid one I put as password input", async function (this: CustomWorld) {
  await this.page.fill('[data-testid="signup-confirm"]', "WrongPassword999!");
});

// -------------------------------
// Login Step Definitions
// -------------------------------

Given("I am on the login page", async function (this: CustomWorld) {
  await this.page.goto("/login");
});

When(
  "I enter correct email {string} and password {string}",
  async function (this: CustomWorld, email: string, password: string) {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
);

Then("I should be redirected to the dashboard", async function (this: CustomWorld) {
  await this.page.waitForURL("**/dashboard");
  expect(this.page.url()).toContain("/dashboard");
});

When(
  "I enter a known email {string} but an incorrect password {string}",
  async function (this: CustomWorld, email: string, password: string) {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
);

Then(
  'I should see "Incorrect password" or a similar error',
  async function (this: CustomWorld) {
    const errorLocator = this.page.locator('[data-testid="login-error"]');
    await expect(errorLocator).toBeVisible();
  }
);

When(
  "I enter an email {string} not associated with any account",
  async function (this: CustomWorld, email: string) {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', "SomePassword123!");
    await this.page.click('[data-testid="login-button"]');
  }
);

Then('I should see a "No account found" error', async function (this: CustomWorld) {
  const errorLocator = this.page.locator('[data-testid="login-error"]');
  await expect(errorLocator).toBeVisible();
});

When('I click "Sign Up"', async function (this: CustomWorld) {
  await this.page.click('[data-testid="login-signup-link"]');
});

Then("I should be taken to the sign-up page", async function (this: CustomWorld) {
  await this.page.waitForURL("**/signup");
  expect(this.page.url()).toContain("/signup");
});

// -------------------------------
// AUTHENTICATION STATE HELPERS (Key Changes Here)
// -------------------------------

Given("I am logged in", async function (this: CustomWorld) {
  // CRITICAL CHANGE:
  // We do NOT log in via UI here. The 'Before' hook in hooks.ts
  // has already loaded the auth.json file into the browser context.
  
  // 1. Just go to the protected page
  await this.page.goto("/dashboard");
  
  // 2. If the auth file was invalid/expired, we will be redirected to login
  if (this.page.url().includes("/login")) {
    throw new Error("Fixture Auth Failed: The stored 'auth.json' is expired or invalid. Delete the '.auth' folder and run tests again.");
  }

  // 3. Verify we are safely inside
  await expect(this.page).toHaveURL(/.*dashboard/);
}); 

Given("I am logged out", async function (this: CustomWorld) {
  // If we need to be logged out, we clear cookies or just open a new plain context
  await this.context?.clearCookies();
  await this.page.goto("/login");
});

// -------------------------------
// Accessing pages
// -------------------------------
When("I try to access the page {string}", async function (this: CustomWorld, path: string) {
  await this.page.goto(path);
});

When("I visit the page {string}", async function (this: CustomWorld, path: string) {
  await this.page.goto(path);
});

When("I view any page", async function (this: CustomWorld) {
  await this.page.goto("/"); 
});

// -------------------------------
// Assertions
// -------------------------------
Then('I should see a request to sign in', async function (this: CustomWorld) {
  const signInReq = this.page.locator('[data-testid="sign-in-request"]');
  await expect(signInReq).toBeVisible({ timeout: 10000 });
});

Then("I should see the dashboard content", async function (this: CustomWorld) {
  const dashboardHeader = this.page.locator('[data-testid="dashboard-header"]');
  await expect(dashboardHeader).toBeVisible();
});

Then('I should not see user-only components', async function (this: CustomWorld) {
  const dashboardHeader = this.page.locator('[data-testid="dashboard-header"]');
  await expect(dashboardHeader).not.toBeVisible();
});