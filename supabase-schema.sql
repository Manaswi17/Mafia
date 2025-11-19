-- Mafia Game Database Schema
-- Run this in your Supabase SQL Editor

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'lobby',
  created_by TEXT NOT NULL,
  started_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  player_id TEXT NOT NULL,
  room_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  is_alive BOOLEAN DEFAULT true,
  has_acted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, room_id)
);

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_player_id TEXT,
  phase TEXT NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Allow all on games" ON games;
DROP POLICY IF EXISTS "Allow all on players" ON players;
DROP POLICY IF EXISTS "Allow all on actions" ON actions;

-- Create policies (allow all for simplicity - adjust for production)
CREATE POLICY "Allow all on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all on actions" ON actions FOR ALL USING (true);

-- Enable real-time (if not already enabled)
-- Note: You may need to enable this in Supabase dashboard under Database > Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE games;
-- ALTER PUBLICATION supabase_realtime ADD TABLE players;
-- ALTER PUBLICATION supabase_realtime ADD TABLE actions;

