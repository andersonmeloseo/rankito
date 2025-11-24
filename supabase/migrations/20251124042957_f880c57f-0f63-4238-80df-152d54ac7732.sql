-- Add bot_name column to rank_rent_sessions
ALTER TABLE rank_rent_sessions 
ADD COLUMN bot_name TEXT NULL;

-- Create index for better performance when filtering bots
CREATE INDEX idx_rank_rent_sessions_bot_name 
ON rank_rent_sessions(bot_name) 
WHERE bot_name IS NOT NULL;

-- Add comment
COMMENT ON COLUMN rank_rent_sessions.bot_name IS 'Name of the bot if this session is from a bot (e.g., "Googlebot", "Bingbot", etc.)';