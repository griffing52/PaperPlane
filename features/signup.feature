Feature: User Sign-Up
@clean
  Scenario: User successfully signs up with valid credentials
    Given I am on the sign-up page
    When I enter a valid email "testuser1@example.com" and a valid password "Password123!"
    And I enter first name "Test" and last name "User"
    And I enter the same password to confirm it
    And I submit the sign-up form
    Then I should be redirected to the dashboard page

@clean
  Scenario: User cannot sign up with an email that already exists
    Given a user already exists with email "test@gmail.com"
    And I am on the sign-up page
    When I attempt to sign up with email "test@gmail.com"
    Then I should see an error

@clean
  Scenario: User cannot sign up with a weak password
    Given I am on the sign-up page
    When I enter an email "weakpassuser@example.com" and a weak password "123"
    Then I should see an error

@clean
  Scenario: User cannot sign up with an invalid email format
    Given I am on the sign-up page
    When I enter an invalid email "not-an-email"
    Then I should stay on signup page

@clean
  Scenario: Sign-up button is disabled until form is valid
    Given I am on the sign-up page
    When I have not completed valid input
    Then the "Sign Up" button should remain disabled

@clean
  Scenario: User cannot sign up without confirming password correctly
    Given I am on the sign-up page
    When I enter an email "mismatchuser@example.com" and a valid password "Password123!"
    And I enter a password that is not the valid one I put as password input
    And I submit the sign-up form
    Then I should see an error
