/**
 * SCENARIO 1: Transaction Matching Query
 *
 * Find transactions where Account A sends money to Account B
 * and Account B sends a similar amount back within 24 hours.
 *
 * Requirements:
 * - A sends to B
 * - B sends back to A
 * - Return amount is within 10% of original amount
 * - Return transaction occurs within 24 hours (exact time window)
 *
 * Expected Results (based on sample data) - exactly 3 rows:
 * - Alice <-> Bob: Forward 10000, Return 9500 (5% difference, 8.5 hours)
 * - Charlie <-> Diana: Forward 5000, Return 5200 (4% difference, 2.75 hours)
 * - Diana <-> Eve: Forward 20000, Return 18500 (7.5% difference, 12.25 hours)
 *
 * Not returned: Eve -> Alice 12000 / Alice -> Eve 12500 (4.17% difference, but 25 hours apart).
 */

SELECT
  ta.transaction_id AS forward_transaction_id,
  tb.transaction_id AS return_transaction_id,
  (SELECT account_holder FROM accounts WHERE account_id = ta.from_account_id) AS account_a,
  (SELECT account_holder FROM accounts WHERE account_id = ta.to_account_id) AS account_b,
  ta.amount AS forward_amount,
  tb.amount AS return_amount,
  ta.transaction_date AS forward_date,
  tb.transaction_date AS return_date,
  ROUND(ABS(ta.amount - tb.amount) / ta.amount * 100, 2) AS percentage_difference,
  ROUND(TIMESTAMPDIFF(MINUTE, ta.transaction_date, tb.transaction_date) / 60, 2) AS hours_difference,
  TIMESTAMPDIFF(MINUTE, ta.transaction_date, tb.transaction_date) AS minutes_difference
FROM transactions ta
INNER JOIN transactions tb ON
  -- A sends to B, B sends back to A
  ta.from_account_id = tb.to_account_id AND
  ta.to_account_id = tb.from_account_id AND
  -- Return transaction is after forward
  tb.transaction_date > ta.transaction_date AND
  -- Return occurs within 24 hours (exact comparison: TIMESTAMPDIFF(HOUR, ...) would truncate 24h59m to 24)
  tb.transaction_date <= ta.transaction_date + INTERVAL 24 HOUR AND
  -- Return amount is within 10% of forward amount
  ABS(ta.amount - tb.amount) / ta.amount * 100 <= 10
ORDER BY ta.transaction_date ASC, tb.transaction_date ASC;
