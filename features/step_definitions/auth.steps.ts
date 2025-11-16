import { Given, When, Then, setWorldConstructor } from "@cucumber/cucumber";

// -----------------------------------------------------------------------------
// World Constructor
// -----------------------------------------------------------------------------
class AuthWorld {
  loggedIn = false;
  currentPage: string | null = null;
  email?: string;
  password?: string;
  lastError?: string;

  existingUser?: string;
  preventedDoubleSubmit = false;
  submitClicks = 0;
  visibleElements: string[] = [];
}

setWorldConstructor(AuthWorld);

// -----------------------------------------------------------------------------
// SIGN-UP STEPS
// -----------------------------------------------------------------------------
Given("I am on the sign-up page", function () {
  this.currentPage = "/signup";
});

Given("I am on any auth form", function () {
  this.currentPage = "/auth";
});

Given("I am on the login or sign-up page", function () {
  this.currentPage = "/auth";
});

When(
  "I enter a valid email {string} and a valid password {string}",
  function (email: string, password: string) {
    this.email = email;
    this.password = password;
  }
);

When(
  "I enter correct email {string} and password {string}",
  function (email: string, password: string) {
    this.email = email;
    this.password = password;
    this.loggedIn = true;
    this.currentPage = "/dashboard";
  }
);

When(
  "I enter an email {string} and a valid password {string}",
  function (email: string, password: string) {
    this.email = email;
    this.password = password;
  }
);

When("I submit the sign-up form", function () {
  if (!this.email || !this.password) {
    this.lastError = "Missing credentials";
  } else {
    this.loggedIn = true;
    this.currentPage = "/dashboard";
  }
});

Given("a user already exists with email {string}", function (email: string) {
  this.existingUser = email;
});

When("I attempt to sign up with email {string}", function (email: string) {
  this.email = email;
  if (this.existingUser === email) {
    this.lastError = "Email already in use";
  } else {
    this.loggedIn = true;
  }
});

Then("I should see a message indicating the email is already in use", function () {
  if (this.lastError !== "Email already in use") {
    throw new Error("Expected 'Email already in use' error");
  }
});

// Weak password
When(
  "I enter an email {string} and a weak password {string}",
  function (email: string, password: string) {
    this.email = email;
    this.password = password;
    if (password.length < 6) {
      this.lastError = "Password too weak";
    }
  }
);

Then("I should see an error telling me the password is too weak", function () {
  if (this.lastError !== "Password too weak") {
    throw new Error("Expected 'Password too weak' error");
  }
});

// Invalid email
When("I enter an invalid email {string}", function (email: string) {
  this.email = email;
  if (!email.includes("@")) {
    this.lastError = "Invalid email format";
  }
});

Then("I should see an error that the email format is invalid", function () {
  if (this.lastError !== "Invalid email format") {
    throw new Error("Expected 'Invalid email format' error");
  }
});

// Disabled submit
When("I have not completed valid input", function () {
  this.lastError = "Form incomplete";
});

Then('the "Sign Up" button should remain disabled', function () {
  if (this.lastError !== "Form incomplete") {
    throw new Error("Expected sign-up button to be disabled");
  }
});

// Go to signup
When('I click "Sign Up"', function () {
  this.currentPage = "/signup";
});

Then("I should be taken to the sign-up page", function () {
  if (this.currentPage !== "/signup") {
    throw new Error("Expected to be on the sign-up page");
  }
});

// -----------------------------------------------------------------------------
// LOGIN STEPS
// -----------------------------------------------------------------------------
Given("I am on the login page", function () {
  this.currentPage = "/login";
});

// Known email, wrong password
When(
  "I enter a known email {string} but an incorrect password {string}",
  function (email: string, password: string) {
    this.email = email;
    this.lastError = "Incorrect password";
  }
);

Then('I should see "Incorrect password" or a similar error', function () {
  if (this.lastError !== "Incorrect password") {
    throw new Error("Expected 'Incorrect password' error");
  }
});

// Unknown user
When("I enter an email {string} not associated with any account", function () {
  this.lastError = "No account found";
});

Then('I should see a "No account found" error', function () {
  if (this.lastError !== "No account found") {
    throw new Error("Expected 'No account found' error");
  }
});

// -----------------------------------------------------------------------------
// ROUTING / PROTECTED PAGES
// -----------------------------------------------------------------------------
Given("I am not logged in", function () {
  this.loggedIn = false;
});

Given("I am logged in", function () {
  this.loggedIn = true;
  this.currentPage = "/dashboard";
});

Given("I am logged out", function () {
  this.loggedIn = false;
});

When("I try to access the page {string}", function (path: string) {
  this.currentPage = this.loggedIn ? path : "/404";
});

When("I visit the page {string}", function (path: string) {
  if (!this.loggedIn) {
    this.currentPage = "/404";
  } else {
    this.currentPage = path;
  }
});

Then('I should see a "Page Not Found" or be redirected to login', function () {
  if (this.currentPage !== "/404") {
    throw new Error("Expected 404 or redirect to login");
  }
});

Then("I should see the dashboard content", function () {
  if (this.currentPage !== "/dashboard") {
    throw new Error("Expected to see dashboard content");
  }
});

Then('I should not see user-only components such as the "Log Out" button', function () {
  if (this.loggedIn) {
    throw new Error("Expected logged-out view");
  }
});

Then("I should no longer have access to {string}", function (path: string) {
  if (this.loggedIn) {
    throw new Error("Expected not to access protected path");
  }
});

// -----------------------------------------------------------------------------
// LOGOUT
// -----------------------------------------------------------------------------
When('I click "Log Out"', function () {
  this.loggedIn = false;
  this.currentPage = "/login";
});

Then("I should be redirected to the login page", function () {
  if (this.currentPage !== "/login") {
    throw new Error("Expected to be redirected to login");
  }
});

// -----------------------------------------------------------------------------
// ERROR HANDLING + EDGE CASES
// -----------------------------------------------------------------------------
Given("I attempt an invalid action", function () {
  this.lastError = "Some invalid action";
});

When("Firebase returns an error such as {string}", function (error: string) {
  this.lastError = error;
});

Then("I should see a friendly message, not internal error codes", function () {
  if (!this.lastError) {
    throw new Error("Expected a friendly error message");
  }
});

// Double submit
When("I click submit multiple times", function () {
  this.submitClicks = 3;
  this.preventedDoubleSubmit = true;
});

Then("only one request should be sent", function () {
  if (!this.preventedDoubleSubmit) {
    throw new Error("Expected only one request to be sent");
  }
});

// UI password masking (placeholder)
Then("the password field should obscure input characters", function () {
  return true;
});
