Feature: User Login
  (Covers login functionality and error handling)

Scenario: User logs in with valid credentials
  Given I am on the login page
  When I enter correct email "test@gmail.com" and password "happyFACE123!"
  Then I should be redirected to the dashboard

Scenario: User cannot log in with the wrong password
  Given I am on the login page
  When I enter a known email "test@gmail.com" but an incorrect password "happyFACE123"
  Then I should see "Incorrect password" or a similar error

Scenario: User cannot log in with a non-existent account
  Given I am on the login page
  When I enter an email "meow@gmail.com" not associated with any account
  Then I should see a "No account found" error

Scenario: User can navigate from login page to sign-up page
  Given I am on the login page
  When I click "Sign Up"
  Then I should be taken to the sign-up page
