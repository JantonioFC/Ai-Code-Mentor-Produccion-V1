-- Migration: Fix generated_content table (recreate with TEXT user_id)

DROP TABLE IF EXISTS generated_content;

CREATE TABLE generated_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL, -- Changed from INTEGER to TEXT
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
