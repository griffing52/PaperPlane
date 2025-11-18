import { Given, When, Then} from "@cucumber/cucumber";
import { expect } from "@playwright/test";

// -------------------------------
// Helper: store last password for confirmation steps
// -------------------------------
Given("I am on the sign-up page", async function () {
  await this.page.goto("/signup");
});

// -------------------------------
// Scenario: User successfully signs up with valid credentials
// -------------------------------
When(
  "I enter a valid email {string} and a valid password {string}",
  async function (email: string, password: string) {
    this.lastPassword = password;
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

When("I enter the same password to confirm it", async function () {
  await this.page.fill('[data-testid="signup-confirm"]', this.lastPassword);
});

When("I submit the sign-up form", async function () {
  await this.page.click('[data-testid="signup-button"]');
});

Then("I should be redirected to the dashboard page", async function () {
  await this.page.waitForURL("**/dashboard", { timeout: 10000 });
  expect(this.page.url()).toContain("/dashboard");
});

// -------------------------------
// Scenario: User cannot sign up with an email that already exists
// -------------------------------
Given("a user already exists with email {string}", async function (email: string) {
  // Assume backend already has this user registered
  this.existingEmail = email;
});

When("I attempt to sign up with email {string}", async function (email: string) {
  await this.page.fill('[data-testid="signup-email"]', email);
  await this.page.fill('[data-testid="signup-password"]', "Password123!");
  await this.page.fill('[data-testid="signup-confirm"]', "Password123!");
  await this.page.click('[data-testid="signup-button"]');
});

Then(
  "I should see a message indicating the email is already in use",
  async function () {
    const visible = await this.page.locator('[data-testid="signup-error"]').isVisible();
    expect(visible).toBeTruthy();
  }
);

// -------------------------------
// Scenario: User cannot sign up with a weak password
// -------------------------------
When(
  "I enter an email {string} and a weak password {string}",
  async function (email: string, password: string) {
    this.lastPassword = password;
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
    await this.page.fill('[data-testid="signup-confirm"]', password);
    await this.page.click('[data-testid="signup-button"]');
  }
);

Then("I should see an error", async function () {
  await this.page.waitForSelector('[data-testid="signup-error"]', { state: 'visible' });
  const visible = await this.page.locator('[data-testid="signup-error"]').isVisible();
  expect(visible).toBeTruthy();
});

// -------------------------------
// Scenario: User cannot sign up with an invalid email format
// -------------------------------
When("I enter an invalid email {string}", async function (email: string) {
  this.lastPassword = "ValidPass123!";
  await this.page.fill('[data-testid="signup-email"]', email);
  await this.page.fill('[data-testid="signup-password"]', this.lastPassword);
  await this.page.fill('[data-testid="signup-confirm"]', this.lastPassword);
  await this.page.click('[data-testid="signup-button"]');
});

// Then(
//   "I should see an error",
//   async function () {
//     await this.page.waitForSelector('[data-testid="signup-error"]', { state: 'visible' });
//     const visible = await this.page.locator('[data-testid="signup-error"]').isVisible();
//     expect(visible).toBeTruthy();
//   }
// );

// -------------------------------
// Scenario: Sign-up button is disabled until form is valid
// -------------------------------
When("I have not completed valid input", async function () {
  await this.page.fill('[data-testid="signup-email"]', "");
  await this.page.fill('[data-testid="signup-password"]', "");
  await this.page.fill('[data-testid="signup-confirm"]', "");
});

Then('the "Sign Up" button should remain disabled', async function () {
  const disabled = await this.page.locator('[data-testid="signup-button"]').isDisabled();
  expect(disabled).toBeTruthy();
});

// -------------------------------
// Scenario: User cannot sign up without confirming password correctly
// -------------------------------
When(
  "I enter an email {string} and a valid password {string}",
  async function (email: string, password: string) {
    this.lastPassword = password;
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

When("I enter a password that is not the valid one I put as password input", async function () {
  await this.page.fill('[data-testid="signup-confirm"]', "WrongPassword999!");
});

// -------------------------------
// Login Step Definitions
// -------------------------------

// Navigate to login page
Given("I am on the login page", async function () {
  await this.page.goto("/login");
});

// -------------------------------
// Scenario: User logs in with valid credentials
// -------------------------------
When(
  "I enter correct email {string} and password {string}",
  async function (email: string, password: string) {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
);

Then("I should be redirected to the dashboard", async function () {
  await this.page.waitForURL("**/dashboard");
  expect(this.page.url()).toContain("/dashboard");
});

// -------------------------------
// Scenario: User cannot log in with the wrong password
// -------------------------------
When(
  "I enter a known email {string} but an incorrect password {string}",
  async function (email: string, password: string) {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
);

Then(
  'I should see "Incorrect password" or a similar error',
  async function () {
    await this.page.waitForSelector('[data-testid="login-error"]', { state: 'visible' });
    const visible = await this.page.locator('[data-testid="login-error"]').isVisible();
    expect(visible).toBeTruthy();
  }
);

// -------------------------------
// Scenario: User cannot log in with a non-existent account
// -------------------------------
When(
  "I enter an email {string} not associated with any account",
  async function (email: string) {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', "SomePassword123!");
    await this.page.click('[data-testid="login-button"]');
  }
);

Then('I should see a "No account found" error', async function () {
  await this.page.waitForSelector('[data-testid="login-error"]', { state: 'visible' });
  const visible = await this.page.locator('[data-testid="login-error"]').isVisible();
  expect(visible).toBeTruthy();
});

// -------------------------------
// Scenario: User can navigate from login page to sign-up page
// -------------------------------
When('I click "Sign Up"', async function () {
  await this.page.click('[data-testid="login-signup-link"]');
});

Then("I should be taken to the sign-up page", async function () {
  await this.page.waitForURL("**/signup");
  expect(this.page.url()).toContain("/signup");
});

// -------------------------------
// Helpers for auth state
// -------------------------------

Given("I am logged in", async function () {
  // Assume you have a test user already created
  const email = "test@gmail.com";
  const password = "happyFACE123!";
  await this.page.goto("/login");
  await this.page.fill('[data-testid="email-input"]', email);
  await this.page.fill('[data-testid="password-input"]', password);
  await this.page.click('[data-testid="login-button"]');
  // Wait for dashboard redirect
  await this.page.waitForURL("**/dashboard");
}); 

Given("I am logged out", async function () {
  // Could be same as "not logged in"
  //await signOut(auth);
});

// -------------------------------
// Accessing pages
// -------------------------------
When("I try to access the page {string}", async function (path: string) {
  await this.page.goto(path);
});

When("I visit the page {string}", async function (path: string) {
  await this.page.goto(path);
});

When("I view any page", async function () {
  await this.page.goto("/"); // Home or a default page
});

// -------------------------------
// Assertions
// -------------------------------
Then('I should see a "Page Not Found" or be redirected to login', async function () {
  const url = this.page.url();
  expect(url.includes("/login") || url.includes("/404")).toBeTruthy();
});

Then("I should see the dashboard content", async function () {
  // Example: look for dashboard-specific header
  const dashboardHeader = await this.page.locator('[data-testid="dashboard-header"]');
  expect(await dashboardHeader.isVisible()).toBeTruthy();
});

Then('I should not see user-only components', async function () {
  const dashboardHeader = await this.page.locator('[data-testid="dashboard-header"]');
  expect(await dashboardHeader.isVisible()).toBeFalsy();
});
