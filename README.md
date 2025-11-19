# Mafia Game - Real-time Web App

A real-time, responsive Mafia game web application built with React, Supabase, and Tailwind CSS. Play on mobile or desktop with each player using their own device.

## Features

- **Lobby System**: Create or join game rooms with unique codes
- **Role Assignment**: Automatic role distribution based on player count
  - Variable Mafia/Citizen counts
  - One Doctor, one Police, one Terrorist per game
  - Random God moderator assignment
- **Real-time Sync**: Live game updates using Supabase
- **God Dashboard**: Full game control for the moderator
- **Mobile-first Design**: Responsive UI for all devices
- **Game Phases**: Night/Day/Voting cycles with role-specific actions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the following schema:

```sql
-- Create games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'lobby',
  created_by TEXT NOT NULL,
  started_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create players table
CREATE TABLE players (
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
CREATE TABLE actions (
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

-- Create policies (allow all for simplicity - adjust for production)
CREATE POLICY "Allow all on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all on actions" ON actions FOR ALL USING (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE actions;
```

4. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Or update `src/lib/supabase.js` directly with your credentials.

### 4. Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Game Rules

### Roles

- **Mafia**: Eliminate all Citizens to win
- **Doctor**: Protect players from Mafia kills (can self-protect once)
- **Police**: Investigate players to learn their team
- **Citizens**: Vote out Mafia during day phase
- **Terrorist**: Can bomb once per game (eliminates self and target)
- **God**: Moderator who sees all roles and controls game flow

### Game Flow

1. **Lobby**: Players join room, God starts game
2. **Night**: Mafia kills, Doctor protects, Police investigates, Terrorist can bomb
3. **Day**: Discussion phase
4. **Voting**: All players vote to eliminate someone
5. **Repeat** until Mafia or Citizens win

### Win Conditions

- **Citizens Win**: All Mafia eliminated
- **Mafia Wins**: Mafia count >= Citizen count

## Role Assignment Logic

The game automatically assigns roles based on total player count:
- **Minimum 6 players required** (1 Mafia, 1 Citizen, 1 Doctor, 1 Police, 1 Terrorist, 1 God)
- For 6 players: Exactly 1 of each role
- For 7+ players: ~30% Mafia, rest Citizens (including Doctor and Police)
- 1 Mafia minimum
- Doctor and Police are counted as Citizens
- One Terrorist per game
- One randomly selected God

## Technologies

- **React 18**: UI framework
- **Vite**: Build tool
- **Supabase**: Backend and real-time database
- **Tailwind CSS**: Styling

## License

MIT

