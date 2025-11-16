Feature: Routing & Access Protection
  (Ensures proper access control based on authentication state)

Scenario: User is redirected when trying to access dashboard without logging in
  Given I am not logged in
  When I try to access the page {string}
  Then I should see a "Page Not Found" or be redirected to login

Scenario: Logged-in user can access dashboard
  Given I am logged in
  When I visit the page {string}
  Then I should see the dashboard content

Scenario: Logged-out user cannot see private UI elements
  Given I am logged out
  When I view any page
  Then I should not see user-only components such as the "Log Out" button
