-- Session Inspection Queries for Debugging
-- Use these queries to troubleshoot cross-origin session authentication issues
--
-- How to run these queries:
-- 1. Connect to your PostgreSQL database using psql or a database client
-- 2. Copy and paste the relevant query below
-- 3. Adjust parameters (userId, sessionID) as needed

-- ============================================================================
-- Query 1: List All Active Sessions
-- ============================================================================
-- Shows all sessions that haven't expired yet, with time remaining until expiration
-- Use this to check if there are multiple active sessions for a user

SELECT
  sid AS session_id,
  sess->>'userId' AS user_id,
  sess->>'userEmail' AS user_email,
  expire AS expires_at,
  EXTRACT(EPOCH FROM (expire - NOW())) AS seconds_until_expire,
  CASE
    WHEN expire < NOW() THEN 'EXPIRED'
    WHEN EXTRACT(EPOCH FROM (expire - NOW())) < 3600 THEN 'EXPIRING SOON (<1hr)'
    ELSE 'ACTIVE'
  END AS status,
  sess->>'csrfInit' AS csrf_initialized
FROM session
WHERE sess->>'userId' IS NOT NULL  -- Only show authenticated sessions
ORDER BY expire DESC;

-- Expected Output:
-- - session_id: The session ID (should match browser cookie value)
-- - user_id: User ID from session data
-- - user_email: User email from session data
-- - expires_at: When the session will expire
-- - seconds_until_expire: Time remaining (negative = already expired)
-- - status: ACTIVE, EXPIRING SOON, or EXPIRED
-- - csrf_initialized: Whether CSRF token was initialized
--
-- What to look for:
-- ✓ Single active session per user = normal
-- ⚠ Multiple active sessions for same user = potential conflict
-- ⚠ EXPIRED sessions with negative time = cleanup needed
-- ⚠ Very short expiration times = session timeout issue


-- ============================================================================
-- Query 2: Find Sessions by User ID
-- ============================================================================
-- Shows all sessions (active and expired) for a specific user
-- Replace '1' with the actual user ID you want to inspect

SELECT
  sid AS session_id,
  sess->>'userId' AS user_id,
  sess->>'userEmail' AS user_email,
  expire AS expires_at,
  NOW() AS current_time,
  CASE
    WHEN expire < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END AS status,
  sess AS full_session_data
FROM session
WHERE sess->>'userId' = '1'  -- REPLACE WITH YOUR USER ID
ORDER BY expire DESC;

-- Expected Output:
-- - Shows all sessions for the specified user
-- - full_session_data: Complete session JSON (includes all session variables)
--
-- What to look for:
-- ⚠ Multiple ACTIVE sessions = potential race condition
-- ⚠ Recently expired session + new session = session regeneration occurred
-- ✓ Single active session = normal


-- ============================================================================
-- Query 3: Inspect Specific Session by Session ID
-- ============================================================================
-- Shows detailed information about a specific session
-- Replace 'YOUR-SESSION-ID-HERE' with the session ID from browser cookie

SELECT
  sid AS session_id,
  sess AS session_data,
  sess->>'userId' AS user_id,
  sess->>'userEmail' AS user_email,
  sess->>'csrfInit' AS csrf_initialized,
  expire AS expires_at,
  NOW() AS current_time,
  EXTRACT(EPOCH FROM (expire - NOW())) AS seconds_until_expire
FROM session
WHERE sid = 'YOUR-SESSION-ID-HERE';  -- REPLACE WITH YOUR SESSION ID

-- Expected Output:
-- - Complete session data for the specified session ID
-- - Shows if session is expired and how long ago
--
-- How to get session ID from browser:
-- 1. Open browser DevTools
-- 2. Go to Application tab (Chrome) or Storage tab (Firefox)
-- 3. Expand Cookies → https://ticketapi.zollc.com (or your domain)
-- 4. Find 'connect.sid' cookie
-- 5. Copy the value (it will be URL-encoded, use the decoded value)
--
-- What to look for:
-- ⚠ Session not found = cookie/session mismatch (session was deleted or expired)
-- ⚠ userId is null = session exists but user not authenticated
-- ✓ userId present + not expired = valid authenticated session


-- ============================================================================
-- Query 4: Count Active Sessions per User
-- ============================================================================
-- Quick check to see if any users have multiple concurrent sessions

SELECT
  sess->>'userId' AS user_id,
  sess->>'userEmail' AS user_email,
  COUNT(*) AS active_session_count,
  STRING_AGG(sid, ', ') AS session_ids
FROM session
WHERE
  sess->>'userId' IS NOT NULL
  AND expire > NOW()
GROUP BY sess->>'userId', sess->>'userEmail'
HAVING COUNT(*) > 1  -- Only show users with multiple sessions
ORDER BY active_session_count DESC;

-- Expected Output:
-- - Lists users with multiple active sessions
-- - session_ids: Comma-separated list of session IDs
--
-- What to look for:
-- ⚠ Results returned = user has multiple active sessions (potential conflict)
-- ✓ No results = all users have single sessions (normal)


-- ============================================================================
-- Query 5: Recently Expired Sessions (Last Hour)
-- ============================================================================
-- Shows sessions that expired recently (within last hour)
-- Useful for debugging session timeout issues

SELECT
  sid AS session_id,
  sess->>'userId' AS user_id,
  sess->>'userEmail' AS user_email,
  expire AS expired_at,
  EXTRACT(EPOCH FROM (NOW() - expire)) AS seconds_since_expired
FROM session
WHERE
  expire < NOW()
  AND expire > NOW() - INTERVAL '1 hour'
  AND sess->>'userId' IS NOT NULL
ORDER BY expire DESC;

-- Expected Output:
-- - Sessions that expired in the last hour
-- - seconds_since_expired: How long ago it expired
--
-- What to look for:
-- ⚠ Session expired right before the auth failure = session timeout caused the issue
-- ⚠ Pattern of rapid expiration = session configuration problem


-- ============================================================================
-- Query 6: Check for Session Regeneration Events
-- ============================================================================
-- Shows if there were multiple session IDs for the same user in a short time
-- Indicates session regeneration (happens during login, password change, etc.)

WITH session_timeline AS (
  SELECT
    sid AS session_id,
    sess->>'userId' AS user_id,
    sess->>'userEmail' AS user_email,
    expire,
    LAG(sid) OVER (PARTITION BY sess->>'userId' ORDER BY expire) AS previous_session_id,
    LAG(expire) OVER (PARTITION BY sess->>'userId' ORDER BY expire) AS previous_expire
  FROM session
  WHERE sess->>'userId' IS NOT NULL
)
SELECT
  user_id,
  user_email,
  session_id,
  previous_session_id,
  expire AS current_session_expires,
  previous_expire AS previous_session_expired,
  EXTRACT(EPOCH FROM (expire - previous_expire)) AS seconds_between_sessions
FROM session_timeline
WHERE
  previous_session_id IS NOT NULL
  AND EXTRACT(EPOCH FROM (expire - previous_expire)) < 300  -- Within 5 minutes
ORDER BY user_id, expire DESC;

-- Expected Output:
-- - Shows session regeneration events (new session created within 5 minutes of previous)
-- - seconds_between_sessions: Time gap between session creation
--
-- What to look for:
-- ⚠ Very small time gap (< 1 second) = rapid session regeneration (potential race condition)
-- ✓ Moderate time gap (few minutes) = normal login/logout pattern


-- ============================================================================
-- Notes on Using These Queries
-- ============================================================================
--
-- Typical Troubleshooting Workflow:
-- 1. Start with Query 1 to see overall session state
-- 2. Use Query 4 to check for multiple sessions per user
-- 3. Use Query 3 with session ID from browser to verify cookie/session match
-- 4. If session missing, check Query 5 for recent expiration
-- 5. If multiple sessions, use Query 6 to detect regeneration race conditions
--
-- Common Findings:
--
-- ✓ NORMAL:
--    - Single active session per user
--    - Session ID in database matches browser cookie
--    - Session not expired
--
-- ⚠ ISSUE: Session not found in database
--    - Browser has cookie but database has no matching session
--    - Likely: Session expired and was cleaned up
--    - Solution: Check session maxAge configuration
--
-- ⚠ ISSUE: Multiple active sessions
--    - Same user has 2+ active sessions
--    - Likely: Website and add-in created separate sessions
--    - Solution: Check cookie domain configuration (should be .zollc.com)
--
-- ⚠ ISSUE: Session exists but no userId
--    - Session in database but userId is null
--    - Likely: User never logged in, or session was invalidated
--    - Solution: Check authentication flow
--
-- ⚠ ISSUE: Rapid session regeneration
--    - Multiple sessions created/destroyed quickly
--    - Likely: Race condition between website and add-in
--    - Solution: Check if both apps regenerate session on certain actions
