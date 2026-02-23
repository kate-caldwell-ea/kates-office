# AI Usage & Cost Management System — Spec

## Context
Kate (OpenClaw agent) runs on `anthropic/claude-opus-4-6` via Anthropic login (not API key).
Fallback chain configured: `claude-sonnet-4-6` → `openai/gpt-4.1`.
Kate's Office is a React+Express+SQLite app deployed on Fly.dev.
Backend: `~/kates-office/backend/server.js` (Express, better-sqlite3)
Frontend: `~/kates-office/frontend/src/pages/` (React, Vite, TailwindCSS, Recharts, Lucide icons)
DB already has `token_usage` table and POST/GET endpoints at `/api/usage` and `/api/usage/summary`.

## Requirements

### 1. Backend: Daily Budget Cap System

Add to schema (migration in server.js startup):
```sql
CREATE TABLE IF NOT EXISTS ai_budget (
    id TEXT PRIMARY KEY,
    daily_limit_usd REAL DEFAULT 40.00,
    alert_threshold_pct REAL DEFAULT 75.0,
    hard_stop_enabled INTEGER DEFAULT 1,
    override_approved_until TEXT, -- ISO datetime, NULL = no override
    override_approved_by TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS ai_budget_alerts (
    id TEXT PRIMARY KEY,
    date TEXT,
    alert_type TEXT, -- 'warning_75', 'warning_90', 'hard_stop', 'override_granted'
    message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
```

**Endpoints to add:**

- `GET /api/ai/usage/today` — today's total usage, cost, budget remaining, % used
- `GET /api/ai/usage/history?days=30` — daily rollup for charting
- `GET /api/ai/budget` — current budget settings
- `PUT /api/ai/budget` — update daily limit, alert threshold
- `POST /api/ai/usage/log` — log a usage entry (called by Kate's cron)
- `POST /api/ai/budget/override` — grant temporary override (requires approval flag)
- `GET /api/ai/usage/sessions` — active sessions with estimated burn rate
- `GET /api/ai/models` — current model config (primary, fallbacks, cron models)

**Cost calculation helper** (add to server):
```javascript
function estimateCost(model, inputTokens, outputTokens, cachedTokens = 0) {
  const pricing = {
    'claude-opus-4-6': { input: 15, output: 75, cached: 3.75 },
    'claude-sonnet-4-6': { input: 3, output: 15, cached: 0.75 },
    'claude-sonnet-4-5': { input: 3, output: 15, cached: 0.75 },
    'claude-haiku-4-5': { input: 0.80, output: 4, cached: 0.08 },
    'gpt-4.1': { input: 2, output: 8, cached: 0.50 },
    'gpt-4.1-mini': { input: 0.40, output: 1.60, cached: 0.10 },
  }; // per 1M tokens
  const p = pricing[model] || pricing['claude-opus-4-6'];
  const uncachedInput = Math.max(0, inputTokens - cachedTokens);
  return (uncachedInput * p.input + outputTokens * p.output + cachedTokens * p.cached) / 1_000_000;
}
```

### 2. Frontend: AI Usage Page (`~/kates-office/frontend/src/pages/AIUsage.jsx`)

**Design:** Match existing Kate's Office aesthetic (dark theme, teal/gold accents, rounded cards).

**Sections:**

#### A. Budget Status Hero
- Large circular progress gauge showing today's spend vs $40 limit
- Color: teal < 75%, gold 75-90%, red > 90%
- Dollar amount spent / remaining
- "HARD STOP ACTIVE" badge when enabled
- Override button (sends alert to Zack for approval)

#### B. Model Configuration Card
- Primary model: claude-opus-4-6
- Fallback 1: claude-sonnet-4-6
- Fallback 2: gpt-4.1
- Cron model: claude-sonnet-4-6
- Visual status indicators (green dot = active, gray = standby)

#### C. Today's Usage Breakdown
- Table/cards showing usage by session type (conversation, cron, subagent, heartbeat)
- Model used, tokens in/out, cached %, estimated cost
- Highlight any session burning > $5

#### D. 30-Day Trend Chart
- Area chart (Recharts) showing daily cost
- $40 budget line overlay
- Color-coded by model

#### E. Active Sessions Monitor
- List of active sessions with real-time token count
- Burn rate estimate (tokens/min → $/hr)
- Kill button for runaway sub-agents (calls OpenClaw API or flags for Kate)

#### F. Alert Log
- Recent budget alerts and overrides
- Timestamps and resolution status

### 3. Navigation
Add "AI Usage" to the sidebar nav in the app layout, with a Bot or Cpu icon from Lucide.

### 4. Seed Data
Insert default budget row on startup:
```sql
INSERT OR IGNORE INTO ai_budget (id, daily_limit_usd, alert_threshold_pct, hard_stop_enabled)
VALUES ('default', 40.00, 75.0, 1);
```

## Implementation Notes
- Follow existing patterns in server.js for route structure
- Follow existing component patterns (see Expenses.jsx for reference)
- Use `framer-motion` for animations like other pages
- Use existing `config.js` for API_URL
- The override approval flow: button on page → POST to backend → Kate alerts Zack on Telegram → Zack approves → Kate calls PUT to extend override
- Don't break any existing functionality
- Run `cd ~/kates-office/frontend && npm run build` after frontend changes
- Test that the server starts: `cd ~/kates-office/backend && node server.js`
