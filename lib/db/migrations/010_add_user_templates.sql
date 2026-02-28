-- Migration 010: Add user_templates table
-- Stores templates generated and manually edited by users

CREATE TABLE IF NOT EXISTS user_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  template_type TEXT NOT NULL,        -- e.g. 'weekly_review', 'weekly_action_plan'
  template_name TEXT NOT NULL,        -- Human-readable name
  content TEXT NOT NULL,              -- Full markdown content (edited by user)
  metadata TEXT,                      -- JSON: generated_at, fields_count, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_templates_user
  ON user_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_user_templates_type
  ON user_templates(user_id, template_type);
