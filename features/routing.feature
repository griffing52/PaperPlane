Feature: Routing & Access Protection
  (Ensures proper access control based on authentication state)

@clean
Scenario: User is redirected when trying to access dashboard without logging in
  Given I am logged out
  When I try to access the page "/dashboard"
  Then I should see a request to sign in

@auth
Scenario: Logged-in user can access dashboard
  Given I am logged in
  When I try to access the page "/dashboard"
  Then I should see the dashboard content

@clean
Scenario: Logged-out user cannot see private UI elements
  Given I am logged out
  When I view any page
  Then I should not see user-only components
