Feature: Personal Loan EMI Calculator with Sliders and Calendar
  Scenario: Calculate EMI for Personal Loan using sliders and interact with calendar
    Given I navigate to the EMI Calculator application
    When I select Personal Loan
    And I set loan amount to "10L" using slider
    And I set interest rate to "12%" using slider
    And I set tenure using calendar widget
    And I submit the calculation
    Then the bar chart should be visible
    And the bar chart should contain multiple bars
    And I can hover over a bar to see tooltip
    And the tooltip value should be valid and greater than zero
