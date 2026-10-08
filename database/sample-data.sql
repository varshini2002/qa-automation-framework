/**
 * Sample Data for Transaction Matching and IPL Scenarios
 */

-- =============================================
-- SCENARIO 1: TRANSACTION DATA
-- =============================================

INSERT INTO accounts (account_holder, balance) VALUES
('Alice Johnson', 50000.00),
('Bob Smith', 50000.00),
('Charlie Brown', 75000.00),
('Diana Prince', 100000.00),
('Eve Wilson', 60000.00);

-- Transaction patterns:
-- 1. Alice->Bob: 10000, Bob->Alice: 9500 (5% difference, 8.5h later) - MATCH
-- 2. Charlie->Diana: 5000, Diana->Charlie: 5200 (4% difference, 2.75h later) - MATCH
-- 3. Alice->Charlie: 15000, Charlie->Eve: 7000 (no return in the opposite direction) - NO MATCH
-- 4. Diana->Eve: 20000, Eve->Diana: 18500 (7.5% difference, 12.25h later) - MATCH
-- 5. Bob->Charlie: 8000, no return - NO MATCH
-- 6. Eve->Alice: 12000, Alice->Eve: 12500 (4.17% difference, but 25h later) - NO MATCH (timing)

INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, transaction_date, description) VALUES
-- Matching pair 1: Alice <-> Bob (within 10% and 24h)
(1, 2, 10000.00, 'transfer', '2024-01-15 10:00:00', 'Payment for services'),
(2, 1, 9500.00, 'transfer', '2024-01-15 18:30:00', 'Return payment'),

-- Matching pair 2: Charlie <-> Diana (within 10% and 24h)
(3, 4, 5000.00, 'transfer', '2024-01-16 09:00:00', 'Loan disbursement'),
(4, 3, 5200.00, 'transfer', '2024-01-16 11:45:00', 'Loan repayment'),

-- Non-matching: Alice -> Charlie (one-way)
(1, 3, 15000.00, 'transfer', '2024-01-17 14:00:00', 'Investment'),

-- Non-matching: Charlie -> Eve (different receiver pair)
(3, 5, 7000.00, 'transfer', '2024-01-17 16:20:00', 'Payment'),

-- Matching pair 3: Diana <-> Eve (within 10% and 24h)
(4, 5, 20000.00, 'transfer', '2024-01-18 08:00:00', 'Large transfer'),
(5, 4, 18500.00, 'transfer', '2024-01-18 20:15:00', 'Returned amount'),

-- Non-matching: Bob -> Charlie (no return within 24h)
(2, 3, 8000.00, 'transfer', '2024-01-19 10:00:00', 'One-way payment'),

-- Non-matching: Eve -> Alice (return but outside 24h window)
(5, 1, 12000.00, 'transfer', '2024-01-19 15:00:00', 'Advance'),
(1, 5, 12500.00, 'transfer', '2024-01-20 16:00:00', 'Return (>24h window)');

-- =============================================
-- SCENARIO 2: IPL 2024 DATA
-- =============================================

INSERT INTO ipl_teams (team_name, city) VALUES
('Mumbai Indians', 'Mumbai'),
('Delhi Capitals', 'Delhi'),
('Kolkata Knight Riders', 'Kolkata'),
('Royal Challengers Bangalore', 'Bangalore'),
('Punjab Kings', 'Chandigarh');

-- Players with different profiles
INSERT INTO ipl_players (player_name, team_id, role) VALUES
('Virat Kohli', 4, 'batsman'),
('Rohit Sharma', 1, 'batsman'),
('AB de Villiers', 4, 'batsman'),
('Shreyas Iyer', 2, 'batsman'),
('David Warner', 5, 'batsman'),
('Suryakumar Yadav', 1, 'batsman'),
('KL Rahul', 5, 'batsman');

-- Matches
INSERT INTO ipl_matches (match_number, match_date, season, venue) VALUES
(1, '2024-03-22', 2024, 'Mumbai'),
(2, '2024-03-23', 2024, 'Delhi'),
(3, '2024-03-24', 2024, 'Kolkata'),
(4, '2024-03-25', 2024, 'Bangalore'),
(5, '2024-03-26', 2024, 'Chandigarh'),
(6, '2024-03-27', 2024, 'Mumbai'),
(7, '2024-03-28', 2024, 'Delhi'),
(8, '2024-03-29', 2024, 'Kolkata');

-- Batting stats - scenarios for 30+ run streaks (3+ consecutive matches required)
-- Virat Kohli: 45, 32, 38, 15 (matches 1-3 with 30+) - QUALIFIES (3)
-- Rohit Sharma: 28, 35, 42, 29 (only matches 2-3 with 30+) - DOES NOT QUALIFY (2)
-- AB de Villiers: 50, 31, 29, 40 (matches 1-2 with 30+, broken by 29, then match 4 alone) - DOES NOT QUALIFY (longest streak 2)
-- Shreyas Iyer: 35, 32, 31, 30, 25 (matches 1-4 with 30+) - QUALIFIES (4)
-- David Warner: 48, 45, 50, 22 (matches 1-3 with 30+) - QUALIFIES (3)
-- Suryakumar Yadav: 25, 28, 32, 35 (only matches 3-4 with 30+) - DOES NOT QUALIFY (2)
-- KL Rahul: 40, 38, 35, 32, 30, 28 (matches 1-5 with 30+) - QUALIFIES (5)

-- Virat Kohli (player_id = 1)
INSERT INTO ipl_batting_stats (player_id, match_id, runs, balls_faced, fours, sixes) VALUES
(1, 1, 45, 32, 4, 2),  -- Match 1: 45 runs
(1, 2, 32, 24, 3, 1),  -- Match 2: 32 runs
(1, 3, 38, 28, 4, 1),  -- Match 3: 38 runs (3rd consecutive 30+)
(1, 4, 15, 18, 1, 0);  -- Match 4: 15 runs (streak broken)

-- Rohit Sharma (player_id = 2)
INSERT INTO ipl_batting_stats (player_id, match_id, runs, balls_faced, fours, sixes) VALUES
(2, 1, 28, 22, 3, 0),  -- Match 1: 28 runs
(2, 2, 35, 26, 4, 1),  -- Match 2: 35 runs
(2, 3, 42, 30, 5, 2),  -- Match 3: 42 runs (2nd consecutive 30+)
(2, 4, 29, 21, 2, 1);  -- Match 4: 29 runs (streak broken at 2)

-- AB de Villiers (player_id = 3)
INSERT INTO ipl_batting_stats (player_id, match_id, runs, balls_faced, fours, sixes) VALUES
(3, 1, 50, 28, 5, 3),  -- Match 1: 50 runs
(3, 2, 31, 25, 3, 1),  -- Match 2: 31 runs (2nd consecutive 30+)
(3, 3, 29, 23, 2, 1),  -- Match 3: 29 runs (streak broken)
(3, 4, 40, 30, 4, 2);  -- Match 4: 40 runs (30+, but a streak of only 1)

-- Shreyas Iyer (player_id = 4)
INSERT INTO ipl_batting_stats (player_id, match_id, runs, balls_faced, fours, sixes) VALUES
(4, 1, 35, 27, 3, 1),  -- Match 1: 35 runs
(4, 2, 32, 24, 3, 1),  -- Match 2: 32 runs
(4, 3, 31, 22, 2, 1),  -- Match 3: 31 runs
(4, 4, 30, 25, 2, 1),  -- Match 4: 30 runs (4th consecutive 30+)
(4, 5, 25, 20, 2, 0);  -- Match 5: 25 runs (streak broken)

-- David Warner (player_id = 5)
INSERT INTO ipl_batting_stats (player_id, match_id, runs, balls_faced, fours, sixes) VALUES
(5, 1, 48, 32, 5, 2),  -- Match 1: 48 runs
(5, 2, 45, 30, 4, 2),  -- Match 2: 45 runs
(5, 3, 50, 35, 6, 2),  -- Match 3: 50 runs (3rd consecutive 30+)
(5, 4, 22, 18, 2, 0);  -- Match 4: 22 runs (streak broken)

-- Suryakumar Yadav (player_id = 6)
INSERT INTO ipl_batting_stats (player_id, match_id, runs, balls_faced, fours, sixes) VALUES
(6, 1, 25, 20, 2, 0),  -- Match 1: 25 runs
(6, 2, 28, 22, 2, 1),  -- Match 2: 28 runs
(6, 3, 32, 24, 3, 1),  -- Match 3: 32 runs
(6, 4, 35, 26, 3, 1);  -- Match 4: 35 runs (only 2nd consecutive 30+)

-- KL Rahul (player_id = 7)
INSERT INTO ipl_batting_stats (player_id, match_id, runs, balls_faced, fours, sixes) VALUES
(7, 1, 40, 30, 4, 1),  -- Match 1: 40 runs
(7, 2, 38, 28, 4, 1),  -- Match 2: 38 runs
(7, 3, 35, 26, 3, 1),  -- Match 3: 35 runs
(7, 4, 32, 24, 3, 1),  -- Match 4: 32 runs
(7, 5, 30, 23, 2, 1),  -- Match 5: 30 runs (5th consecutive 30+)
(7, 6, 28, 21, 2, 0);  -- Match 6: 28 runs (streak broken)
