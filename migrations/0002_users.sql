CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

INSERT INTO users (email, full_name, role, created_at)
SELECT 'salle.kma@gmail.com', 'Salle', 'admin', datetime('now')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'salle.kma@gmail.com'
);
