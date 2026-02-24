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

-- AI Budget management
CREATE TABLE IF NOT EXISTS ai_budget (
    id TEXT PRIMARY KEY,
    daily_limit_usd REAL DEFAULT 40.00,
    alert_threshold_pct REAL DEFAULT 75.0,
    hard_stop_enabled INTEGER DEFAULT 1,
    override_approved_until TEXT, -- ISO datetime, NULL = no override
    override_approved_by TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- AI Usage logging
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT DEFAULT (datetime('now')),
    session_key TEXT,
    model TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cached_tokens INTEGER DEFAULT 0,
    estimated_cost_usd REAL DEFAULT 0,
    session_type TEXT, -- 'conversation', 'cron', 'subagent', 'heartbeat'
    notes TEXT
);

-- AI Budget alerts
CREATE TABLE IF NOT EXISTS ai_budget_alerts (
    id TEXT PRIMARY KEY,
    date TEXT,
    alert_type TEXT, -- 'warning_75', 'warning_90', 'hard_stop', 'override_granted'
    message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Security alerts
CREATE TABLE IF NOT EXISTS security_alerts (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    severity TEXT DEFAULT 'info', -- 'info', 'advisory', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    source TEXT,
    source_url TEXT,
    recommendation TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'acknowledged', 'resolved'
    created_at TEXT DEFAULT (datetime('now'))
);

-- Security recommendations
CREATE TABLE IF NOT EXISTS security_recommendations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
    category TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'implemented', 'dismissed'
    created_at TEXT DEFAULT (datetime('now'))
);

-- Security community issues
CREATE TABLE IF NOT EXISTS security_community_issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'frustration', 'bug', 'feature_request', 'tip'
    mentions INTEGER DEFAULT 1,
    source TEXT,
    source_url TEXT,
    qapi_correlation TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Bennett food introduction log
CREATE TABLE IF NOT EXISTS bennett_foods (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    food TEXT NOT NULL,
    category TEXT, -- 'fruit', 'vegetable', 'grain', 'protein', 'dairy'
    reaction TEXT, -- 'loved', 'okay', 'disliked', 'allergic'
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Bennett milestones
CREATE TABLE IF NOT EXISTS bennett_milestones (
    id TEXT PRIMARY KEY,
    date TEXT,
    milestone TEXT NOT NULL,
    category TEXT, -- 'motor', 'language', 'social', 'cognitive'
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Gift tracker
CREATE TABLE IF NOT EXISTS gifts (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    birthday TEXT,
    budget_min REAL,
    budget_max REAL,
    year INTEGER,
    gift_idea TEXT,
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'researching', 'selected', 'ordered', 'shipped', 'delivered'
    purchase_url TEXT,
    cost REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage(date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_timestamp ON ai_usage_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_session ON ai_usage_log(session_key);
CREATE INDEX IF NOT EXISTS idx_ai_budget_alerts_date ON ai_budget_alerts(date);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_recs_status ON security_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_bennett_foods_date ON bennett_foods(date);
CREATE INDEX IF NOT EXISTS idx_bennett_milestones_date ON bennett_milestones(date);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON gifts(recipient);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
CREATE INDEX IF NOT EXISTS idx_qapi_incidents_created ON qapi_incidents(created_at);
