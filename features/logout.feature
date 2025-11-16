Feature: User Logout
  (Tests proper logout functionality and access restrictions)

Scenario: User logs out successfully
  Given I am logged in
  When I click "Log Out"
  Then I should be redirected to the login page
  And I should no longer have access to {string}
