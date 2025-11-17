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


