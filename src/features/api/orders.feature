@api
Feature: Orders API

  Scenario: Get all orders with default pagination
    When I request all orders with default pagination
    Then the response status code should be 200
    And the response should have pagination information
    And the response should contain a list of orders
    And each order should have id, userId, productId, quantity, totalPrice, status, and createdAt

  Scenario: Get orders with custom pagination
    When I request orders with page 1 and limit 5
    Then the response status code should be 200
    And the pagination should show page 1 with limit 5
    And the response should contain at most 5 orders

  Scenario: Filter orders by status
    When I request orders filtered by status "pending"
    Then the response status code should be 200
    And all orders in response should have status "pending"

  Scenario: Filter orders by status shipped
    When I request orders filtered by status "shipped"
    Then the response status code should be 200
    And all orders in response should have status "shipped"

  Scenario: Filter orders by userId
    When I request orders filtered by userId 101
    Then the response status code should be 200
    And all orders in response should belong to userId 101

  Scenario: Invalid status filter
    When I request orders filtered by status "invalid_status"
    Then the response status code should be 400
    And the response should contain error message "Invalid status"

  Scenario: Invalid userId filter
    When I request orders filtered by userId "not_a_number"
    Then the response status code should be 400
    And the response should contain error message "Invalid userId"

  Scenario: Create a valid order successfully
    When I create an order with:
      | userId | 110 |
      | productId | 3 |
      | quantity | 2 |
    Then the response status code should be 201
    And the response should contain the created order
    And the order status should be "pending"
    And the order totalPrice should be calculated correctly as product price times quantity
    And the order should have a createdAt timestamp

  Scenario: Create order with insufficient stock
    When I create an order with:
      | userId | 110 |
      | productId | 1 |
      | quantity | 100 |
    Then the response status code should be 400
    And the response should contain error message "Insufficient stock"

  Scenario: Create order with product not found
    When I create an order with:
      | userId | 110 |
      | productId | 9999 |
      | quantity | 1 |
    Then the response status code should be 404
    And the response should contain error message "Product with id 9999 not found"

  Scenario: Create order missing userId field
    When I create an order with:
      | productId | 3 |
      | quantity | 1 |
    Then the response status code should be 400
    And the response should contain error message "Missing required field: userId"

  Scenario: Create order missing productId field
    When I create an order with:
      | userId | 110 |
      | quantity | 1 |
    Then the response status code should be 400
    And the response should contain error message "Missing required field: productId"

  Scenario: Create order missing quantity field
    When I create an order with:
      | userId | 110 |
      | productId | 3 |
    Then the response status code should be 400
    And the response should contain error message "Missing required field: quantity"

  Scenario: Create order with invalid userId type
    When I create an order with:
      | userId | "not_a_number" |
      | productId | 3 |
      | quantity | 1 |
    Then the response status code should be 400
    And the response should contain error message "Invalid userId"

  Scenario: Create order with invalid quantity
    When I create an order with:
      | userId | 110 |
      | productId | 3 |
      | quantity | 0 |
    Then the response status code should be 400
    And the response should contain error message "Invalid quantity"
