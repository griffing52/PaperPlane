Feature: User Sign-Up
  (Covers basic sign-up functionality and edge cases)

Scenario: User successfully signs up with valid credentials
  Given I am on the sign-up page
  When I enter a valid email {string} and a valid password {string}
  And I enter the same password to confirm it
  And I submit the sign-up form
  Then I should be redirected to the login page

Scenario: User cannot sign up with an email that already exists
  Given a user already exists with email {string}
  And I am on the sign-up page
  When I attempt to sign up with email {string}
  Then I should see a message indicating the email is already in use

Scenario: User cannot sign up with a weak password
  Given I am on the sign-up page
  When I enter an email {string} and a weak password {string}
  And I submit the form
  Then I should see an error telling me the password is too weak

Scenario: User cannot sign up with an invalid email format
  Given I am on the sign-up page
  When I enter an invalid email {string}
  Then I should see an error that the email format is invalid

Scenario: Sign-up button is disabled until form is valid
  Given I am on the sign-up page
  When I have not completed valid input
  Then the "Sign Up" button should remain disabled

Scenario: User cannot sign up without confirming password correctly
  Given I am on the sign-up page
  When I enter an email {string} and a valid password {string}
  And I enter a password that is not the valid one I put as password input 
  And I submit the form
  Then I should see an error telling me the two password fields need to match