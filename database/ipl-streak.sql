/**
 * SCENARIO 2: IPL 2024 Player Streaks Query
 *
 * Find players scoring 30+ runs in at least 3 consecutive matches.
 * Uses window functions to identify consecutive matches with 30+ runs.
 *
 * Requirements:
 * - Player must score 30 or more runs
 * - Must be consecutive matches (no breaks)
 * - Minimum 3 consecutive matches
 * - Return player name and streak start date
 *
 * Expected Results (based on sample data) - 4 players, all streaks starting 2024-03-22:
 * - KL Rahul: 5 consecutive (matches 1-5)
 * - Shreyas Iyer: 4 consecutive (matches 1-4)
 * - David Warner: 3 consecutive (matches 1-3)
 * - Virat Kohli: 3 consecutive (matches 1-3)
 *
 * Not returned (longest 30+ streak is 2):
 * - Rohit Sharma (matches 2-3), AB de Villiers (matches 1-2), Suryakumar Yadav (matches 3-4)
 */

-- Method 1: Using ROW_NUMBER() and GROUP BY to identify consecutive runs
-- "Consecutive" here means consecutive league match numbers (match_number).
WITH scoring_matches AS (
  -- Get all matches where player scored 30+ runs
  SELECT
    p.player_id,
    p.player_name,
    t.team_name,
    m.match_id,
    m.match_number,
    m.match_date,
    b.runs,
    -- Use ROW_NUMBER to get sequence of 30+ scoring matches
    ROW_NUMBER() OVER (PARTITION BY p.player_id ORDER BY m.match_id) AS match_sequence
  FROM ipl_batting_stats b
  INNER JOIN ipl_players p ON b.player_id = p.player_id
  INNER JOIN ipl_matches m ON b.match_id = m.match_id
  INNER JOIN ipl_teams t ON p.team_id = t.team_id
  WHERE b.runs >= 30 AND m.season = 2024
),
consecutive_groups AS (
  -- Group consecutive matches together
  -- If match_number is sequential and we've assigned sequence numbers,
  -- match_number - match_sequence should be constant for consecutive group
  SELECT
    player_id,
    player_name,
    team_name,
    match_number,
    match_date,
    runs,
    match_sequence,
    -- Create a group identifier for consecutive matches
    match_number - ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY match_number) AS streak_group
  FROM scoring_matches
),
streaks AS (
  -- Count consecutive matches per group and get start date
  SELECT
    player_id,
    player_name,
    team_name,
    COUNT(*) AS consecutive_matches,
    MIN(match_date) AS streak_start_date,
    MIN(match_number) AS streak_start_match,
    MAX(match_number) AS streak_end_match,
    GROUP_CONCAT(runs ORDER BY match_number SEPARATOR ', ') AS runs_in_streak
  FROM consecutive_groups
  GROUP BY player_id, player_name, team_name, streak_group
  HAVING COUNT(*) >= 3
)
SELECT
  player_name,
  team_name,
  consecutive_matches,
  streak_start_date,
  streak_start_match,
  streak_end_match,
  runs_in_streak
FROM streaks
ORDER BY consecutive_matches DESC, streak_start_date ASC, player_name ASC;

-- Alternative Method 2: consecutive matches the player actually batted in
-- Method 1 treats a gap in league match numbers as a break. In a real season a team does not
-- play every league match, so this variant numbers each player's own innings instead:
-- for a run of 30+ innings, (innings sequence - 30+ sequence) stays constant.
-- On the sample data (every player bats in matches 1..N with no gaps) both methods agree.

WITH player_innings AS (
  -- Number every innings of each player in match order (before filtering on runs)
  SELECT
    p.player_id,
    p.player_name,
    m.match_number,
    m.match_date,
    b.runs,
    ROW_NUMBER() OVER (PARTITION BY p.player_id ORDER BY m.match_number) AS innings_seq
  FROM ipl_batting_stats b
  INNER JOIN ipl_players p ON b.player_id = p.player_id
  INNER JOIN ipl_matches m ON b.match_id = m.match_id
  WHERE m.season = 2024
),
scoring_innings AS (
  -- Keep 30+ innings: consecutive ones share the same streak_group
  SELECT
    player_id,
    player_name,
    match_date,
    CAST(innings_seq AS SIGNED)
      - CAST(ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY match_number) AS SIGNED) AS streak_group
  FROM player_innings
  WHERE runs >= 30
)
SELECT
  player_name,
  MIN(match_date) AS streak_start_date,
  COUNT(*) AS consecutive_matches
FROM scoring_innings
GROUP BY player_id, player_name, streak_group
HAVING COUNT(*) >= 3
ORDER BY consecutive_matches DESC, streak_start_date ASC, player_name ASC;
