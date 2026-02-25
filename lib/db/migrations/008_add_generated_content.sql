-- Migration: Add generated_content table
-- Description: Stores AI-generated lessons to avoid regeneration and provide history

CREATE TABLE IF NOT EXISTS generated_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  semana_id INTEGER NOT NULL,
  dia_index INTEGER NOT NULL, -- 0-based index (0-4)
  pomodoro_index INTEGER NOT NULL, -- 0-based index (0-3)
  content TEXT NOT NULL, -- JSON string with lesson data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate generations for same slot/user
  UNIQUE(user_id, semana_id, dia_index, pomodoro_index)
);

-- Index for faster retrieval
CREATE INDEX IF NOT EXISTS idx_generated_content_lookup 
ON generated_content(user_id, semana_id, dia_index, pomodoro_index);
