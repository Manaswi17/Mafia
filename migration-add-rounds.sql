-- Migration to add round management to existing Mafia game database
-- Run this in your Supabase SQL Editor to update existing schema

-- Add new columns to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS winner_team TEXT;

-- Add round_number column to actions table
ALTER TABLE actions 
ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1;

-- Update existing games to have round 1
UPDATE games 
SET current_round = 1 
WHERE current_round IS NULL;

-- Update existing actions to have round 1
UPDATE actions 
SET round_number = 1 
WHERE round_number IS NULL;