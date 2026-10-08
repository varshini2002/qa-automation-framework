Feature: Home Loan EMI Calculator - Scenario A
  Scenario: Calculate EMI for Home Loan with Scenario A parameters
    Given I navigate to the EMI Calculator application
    When I select Home Loan
    And I enter loan amount as "25L"
    And I enter interest rate as "10%"
    And I enter tenure as "10 years"
    And I calculate EMI
    Then the EMI result should be displayed
    And I independently calculate EMI in code
    And the calculated EMI should match the displayed EMI
    And the pie chart should be visible
    And the pie chart should contain numerical values
    And both pie chart values should be greater than zero

  Scenario: Calculate EMI for Home Loan with Scenario B parameters
    Given I navigate to the EMI Calculator application
    When I select Home Loan
    And I enter loan amount as "50L"
    And I enter interest rate as "7.5%"
    And I enter tenure as "15 years"
    And I calculate EMI
    Then the EMI result should be displayed
    And I independently calculate EMI in code
    And the calculated EMI should match the displayed EMI
    And the pie chart should be visible
    And the pie chart should contain numerical values
    And both pie chart values should be greater than zero
