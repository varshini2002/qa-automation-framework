@api
Feature: Products API

  Scenario: Get all products with default pagination
    When I request all products with default pagination
    Then the response status code should be 200
    And the response should have pagination information
    And the response should contain a list of products
    And each product should have id, name, category, price, and stock

  Scenario: Filter products by category
    When I request products filtered by category "electronics"
    Then the response status code should be 200
    And all products in response should have category "electronics"

  Scenario: Filter products by search term
    When I request products with search term "laptop"
    Then the response status code should be 200
    And all products in response should have "laptop" in name or category

  Scenario: Filter products by price range
    When I request products with minPrice 50 and maxPrice 150
    Then the response status code should be 200
    And all products should have price between 50 and 150

  Scenario: Sort products by price
    When I request products sorted by "price"
    Then the response status code should be 200
    And the products should be sorted by price in ascending order

  Scenario: Sort products by name
    When I request products sorted by "name"
    Then the response status code should be 200
    And the products should be sorted by name in ascending order

  Scenario: Get products with custom page and limit
    When I request products with page 2 and limit 5
    Then the response status code should be 200
    And the pagination should show page 2 with limit 5

  Scenario: Invalid sort parameter
    When I request products sorted by "invalid_field"
    Then the response status code should be 400
    And the response should contain error message "Invalid sort field"

  Scenario: Invalid page parameter
    When I request products with page -1
    Then the response status code should be 400
    And the response should contain error message "Invalid page parameter"

  Scenario: Invalid limit parameter
    When I request products with limit 999
    Then the response status code should be 400
    And the response should contain error message "Invalid limit parameter"

  Scenario: Invalid price filter
    When I request products with minPrice "abc"
    Then the response status code should be 400
    And the response should contain error message "Invalid minPrice parameter"
