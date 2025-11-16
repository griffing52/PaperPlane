Feature: Error Reporting & Edge Behaviors
  (Covers friendly error messages, edge cases, and UI behavior)

Scenario: Authentication errors display user-friendly text
  Given I attempt an invalid action
  When Firebase returns an error such as {string}
  Then I should see a friendly message, not internal error codes

Scenario: Form does not submit twice accidentally
  Given I am on any auth form
  When I click submit multiple times
  Then only one request should be sent

Scenario: Password input field hides text
  Given I am on the login or sign-up page
  Then the password field should obscure input characters
