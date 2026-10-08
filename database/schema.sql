/**
 * QA Automation Assessment - SQL Schema
 * Implements two scenarios: Transaction Matching and IPL 2024 Streaks
 */

-- =============================================
-- SCENARIO 1: TRANSACTION MATCHING
-- =============================================
-- Find transactions where Account A sends money to Account B
-- and Account B sends a similar amount back within 24 hours (within 10% tolerance)

CREATE TABLE IF NOT EXISTS accounts (
  account_id INT PRIMARY KEY AUTO_INCREMENT,
  account_holder VARCHAR(100) NOT NULL UNIQUE,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_holder (account_holder)
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id INT PRIMARY KEY AUTO_INCREMENT,
  from_account_id INT NOT NULL,
  to_account_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_type VARCHAR(50) DEFAULT 'transfer',
  description VARCHAR(255),
  transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (from_account_id) REFERENCES accounts(account_id) ON DELETE RESTRICT,
  FOREIGN KEY (to_account_id) REFERENCES accounts(account_id) ON DELETE RESTRICT,

  CHECK (amount > 0),
  CHECK (from_account_id != to_account_id),

  INDEX idx_from_account (from_account_id),
  INDEX idx_to_account (to_account_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_sender_receiver (from_account_id, to_account_id, transaction_date)
);

-- =============================================
-- SCENARIO 2: IPL 2024 PLAYER STREAKS
-- =============================================
-- Find players scoring 30+ runs in at least 3 consecutive matches
-- Use window functions and date-based grouping

CREATE TABLE IF NOT EXISTS ipl_teams (
  team_id INT PRIMARY KEY AUTO_INCREMENT,
  team_name VARCHAR(100) NOT NULL UNIQUE,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ipl_players (
  player_id INT PRIMARY KEY AUTO_INCREMENT,
  player_name VARCHAR(100) NOT NULL,
  team_id INT NOT NULL,
  role VARCHAR(50), -- batsman, bowler, all-rounder
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (team_id) REFERENCES ipl_teams(team_id) ON DELETE RESTRICT,
  INDEX idx_player_name (player_name),
  INDEX idx_team (team_id)
);

CREATE TABLE IF NOT EXISTS ipl_matches (
  match_id INT PRIMARY KEY AUTO_INCREMENT,
  match_number INT NOT NULL,
  match_date DATE NOT NULL,
  season INT DEFAULT 2024,
  venue VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_match_per_season (match_number, season),
  INDEX idx_match_date (match_date),
  INDEX idx_season (season)
);

CREATE TABLE IF NOT EXISTS ipl_batting_stats (
  stat_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  match_id INT NOT NULL,
  runs INT DEFAULT 0,
  balls_faced INT DEFAULT 0,
  fours INT DEFAULT 0,
  sixes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (player_id) REFERENCES ipl_players(player_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES ipl_matches(match_id) ON DELETE CASCADE,

  UNIQUE KEY unique_player_match (player_id, match_id),
  INDEX idx_player_runs (player_id, runs),
  INDEX idx_match (match_id)
);

-- =============================================
-- CREATE VIEWS FOR EASIER QUERYING
-- =============================================

-- View for transaction analysis
CREATE OR REPLACE VIEW transaction_analysis AS
SELECT
  t.transaction_id,
  t.from_account_id,
  t.to_account_id,
  a1.account_holder AS from_account_name,
  a2.account_holder AS to_account_name,
  t.amount,
  t.transaction_date,
  t.description
FROM transactions t
INNER JOIN accounts a1 ON t.from_account_id = a1.account_id
INNER JOIN accounts a2 ON t.to_account_id = a2.account_id;

-- View for player performance
CREATE OR REPLACE VIEW player_performance AS
SELECT
  ip.player_id,
  ip.player_name,
  it.team_name,
  im.match_number,
  im.match_date,
  ibs.runs,
  ibs.balls_faced,
  CASE
    WHEN ibs.balls_faced > 0 THEN ROUND((ibs.runs / ibs.balls_faced) * 100, 2)
    ELSE 0
  END AS strike_rate
FROM ipl_batting_stats ibs
INNER JOIN ipl_players ip ON ibs.player_id = ip.player_id
INNER JOIN ipl_matches im ON ibs.match_id = im.match_id
INNER JOIN ipl_teams it ON ip.team_id = it.team_id;
