-- Kate's Office Database Schema

-- Assignments (Kanban items)
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'inbox' CHECK(status IN ('inbox', 'in_progress', 'blocked', 'waiting', 'done', 'archived')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('urgent', 'high', 'normal', 'low')),
    due_date TEXT,
    tags TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    position INTEGER DEFAULT 0
);

-- Assignment comments
CREATE TABLE IF NOT EXISTS assignment_comments (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    author TEXT DEFAULT 'zack',
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    category TEXT,
    date TEXT DEFAULT (date('now')),
    vendor TEXT,
    payment_method TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Token usage tracking
CREATE TABLE IF NOT EXISTS token_usage (
    id TEXT PRIMARY KEY,
    date TEXT DEFAULT (date('now')),
    model TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    session_type TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    role TEXT CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    metadata TEXT -- JSON for extra info
);

-- QAPI Incidents
CREATE TABLE IF NOT EXISTS qapi_incidents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'low' CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'closed')),
    root_cause TEXT,
    corrective_action TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Quick notes
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Daily questions from Kate
CREATE TABLE IF NOT EXISTS daily_questions (
    id TEXT PRIMARY KEY,
    date TEXT DEFAULT (date('now')),
    questions TEXT NOT NULL, -- JSON array of questions
    answers TEXT, -- JSON array of answers (filled by Zack)
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'answered', 'skipped')),
    created_at TEXT DEFAULT (datetime('now')),
    answered_at TEXT
);

-- Cron jobs sync (mirrors OpenClaw cron state)
CREATE TABLE IF NOT EXISTS cron_jobs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL, -- JSON schedule object
    next_run TEXT,
    last_run TEXT,
    last_status TEXT,
    enabled INTEGER DEFAULT 1,
    payload_summary TEXT,
    synced_at TEXT DEFAULT (datetime('now'))
);

-- Budgets for expense tracking
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT, -- null means overall budget
    amount REAL NOT NULL,
    period TEXT DEFAULT 'monthly' CHECK(period IN ('monthly', 'yearly', 'weekly')),
    alert_threshold REAL DEFAULT 0.8, -- Alert at 80% by default
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Voice notes
CREATE TABLE IF NOT EXISTS voice_notes (
    id TEXT PRIMARY KEY,
    transcript TEXT,
    audio_url TEXT,
    duration_seconds REAL,
    action_taken TEXT, -- 'chat', 'assignment', 'none'
    action_id TEXT, -- ID of created assignment or chat message
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage(date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
