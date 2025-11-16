import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

// -------------------------------
// NAVIGATION
// -------------------------------
Given("I am on the login page", async function () {
  await this.page.goto("/login");
});

Given("I am on the sign-up page", async function () {
  await this.page.goto("/signup");
});

// -------------------------------
// LOGIN
// -------------------------------
When(
  "I enter correct email {string} and password {string}",
  async function (email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
);

Then("I should be redirected to the dashboard", async function () {
  await this.page.waitForURL("**/dashboard");
  expect(this.page.url()).toContain("/dashboard");
});

// Wrong password
When(
  "I enter a known email {string} but an incorrect password {string}",
  async function (email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
);

Then('I should see "Incorrect password" or a similar error', async function () {
  const errorVisible = await this.page
    .locator('[data-testid="error"]')
    .isVisible();

  expect(errorVisible).toBeTruthy();
});

// -------------------------------
// SIGN-UP
// -------------------------------
When(
  "I enter a valid email {string} and a valid password {string}",
  async function (email: string, password: string) {
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

When("I submit the sign-up form", async function () {
  await this.page.click('[data-testid="submit-button"]');
});

Then(
  "I should see a confirmation or be redirected to my dashboard",
  async function () {
    const confirmation = await this.page
      .locator('text=/success|confirmation/i')
      .isVisible()
      .catch(() => false);

    const onDashboard = this.page.url().includes("/dashboard");

    expect(confirmation || onDashboard).toBeTruthy();
  }
);

// Weak password
When(
  "I enter an email {string} and a weak password {string}",
  async function (email: string, password: string) {
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
  }
);

Then("I should see an error telling me the password is too weak", async function () {
  const visible = await this.page
    .locator("text=Password too weak")
    .isVisible();
  expect(visible).toBeTruthy();
});

// -------------------------------
// ROUTING / PROTECTED PAGES
// -------------------------------
When("I try to access the page {string}", async function (path: string) {
  await this.page.goto(path);
});

Then("I should see the dashboard content", async function () {
  await this.page.waitForURL("**/dashboard");
  const heading = await this.page.locator("text=Dashboard").isVisible();
  expect(heading).toBeTruthy();
});

Then("I should see a 404 page", async function () {
  expect(this.page.url()).toContain("/404");
});

// -------------------------------
// LOGOUT
// -------------------------------
When('I click "Log Out"', async function () {
  await this.page.click('[data-testid="logout-button"]');
});

Then("I should be redirected to the login page", async function () {
  await this.page.waitForURL("**/login");
  expect(this.page.url()).toContain("/login");
});
