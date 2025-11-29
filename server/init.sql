PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  displayName TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  client TEXT NOT NULL,
  project_id TEXT NOT NULL,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'Por hacer',
  developer TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
