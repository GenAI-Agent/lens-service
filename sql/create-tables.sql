CREATE TABLE IF NOT EXISTS manual_indexes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  keywords TEXT,
  fingerprint TEXT,
  embedding TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  sources TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
