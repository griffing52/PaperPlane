import { Given, When, Then } from "@cucumber/cucumber";
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

Then("I should be redirected to the login page", async function () {
  await this.page.waitForURL("**/login");
  expect(this.page.url()).toContain("/login");
});

// -------------------------------
// Scenario: User cannot sign up with an email that already exists
// -------------------------------
Given("a user already exists with email {string}", async function (email) {
  // This is only storing the value — no callback style allowed
  this.existingEmail = email;
});

When("I attempt to sign up with email {string}", async function (email) {
  await this.page.fill('[data-testid="signup-email"]', email);
  await this.page.fill('[data-testid="signup-password"]', "Password123!");
  await this.page.fill('[data-testid="signup-confirm"]', "Password123!");
  await this.page.click('[data-testid="signup-button"]');
});

Then("I should see a message indicating the email is already in use", async function () {
  const visible = await this.page.locator('[data-testid="error"]').isVisible();
  expect(visible).toBeTruthy();
});

// -------------------------------
// Scenario: User cannot sign up with a weak password
// -------------------------------
When(
  "I enter an email {string} and a weak password {string}",
  async function (email, password) {
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

When("I submit the form", async function () {
  await this.page.click('[data-testid="signup-button"]');
});

Then("I should see an error telling me the password is too weak", async function () {
  const visible = await this.page.locator("text=Password too weak").isVisible();
  expect(visible).toBeTruthy();
});

// -------------------------------
// Scenario: User cannot sign up with an invalid email format
// -------------------------------
When("I enter an invalid email {string}", async function (email) {
  await this.page.fill('[data-testid="signup-email"]', email);
  await this.page.fill('[data-testid="signup-password"]', "ValidPass123!");
  await this.page.fill('[data-testid="signup-confirm"]', "ValidPass123!");
  await this.page.click('[data-testid="signup-button"]');
});

Then("I should see an error that the email format is invalid", async function () {
  const visible = await this.page.locator("text=invalid email").isVisible();
  expect(visible).toBeTruthy();
});

// -------------------------------
// Scenario: Sign-up button is disabled until form is valid
// -------------------------------
When("I have not completed valid input", async function () {
  await this.page.fill('[data-testid="signup-email"]', "");
  await this.page.fill('[data-testid="signup-password"]', "");
  // no confirm field on purpose
});

Then('the "Sign Up" button should remain disabled', async function () {
  const disabled = await this.page
    .locator('[data-testid="signup-button"]')
    .isDisabled();
  expect(disabled).toBeTruthy();
});

// -------------------------------
// Scenario: User cannot sign up without confirming password correctly
// -------------------------------
When(
  "I enter an email {string} and a valid password {string}",
  async function (email, password) {
    this.lastPassword = password;
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

When(
  "I enter a password that is not the valid one I put as password input",
  async function () {
    await this.page.fill('[data-testid="signup-confirm"]', "WrongPassword999!");
  }
);

Then(
  "I should see an error telling me the two password fields need to match",
  async function () {
    const visible = await this.page
      .locator("text=passwords must match")
      .isVisible();
    expect(visible).toBeTruthy();
  }
);
