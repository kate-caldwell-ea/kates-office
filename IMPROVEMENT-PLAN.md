# Kate's Office — Master Improvement Plan
## Comprehensive Audit & Fix Spec | February 23, 2026

---

## AUDIT FINDINGS

### Critical: Missing Backend Endpoints
The following pages call API endpoints that DON'T EXIST in server.js:
- **Questions page** → `/api/questions` (missing)
- **Cron Jobs page** → `/api/cron`, `/api/cron/sync` (missing)
- **Expenses page** → `/api/budgets`, `/api/budgets/status` (missing)
- **Security page** → `/api/security/*` (missing)
- **QAPI page** → `/api/qapi/trends` (missing)
- **Family Hub** → `/api/family` exists but returns empty/placeholder
- **Travel Planner** → `/api/trips` exists but returns empty/placeholder

### Critical: Non-functional Features
1. **AI Usage shows $0** — No data flowing in. Need a usage logging mechanism that Kate calls to report token usage after each interaction.
2. **QAPI incidents not feeding** — Kate logs 🚩 incidents in conversation but they never reach the QAPI page. Need an API for Kate to POST incidents.
3. **Questions page empty** — Kate generates 3 daily questions but has no mechanism to POST them here.
4. **Cron Jobs page broken** — OpenClaw cron data isn't syncing. Need integration.
5. **Chat page still exists** in pages/ but removed from routes (dead code).

### Design Issues
1. **Cron Jobs page** — Hard to read (Zack confirmed)
2. **Expenses vs AI Usage** — Unclear distinction. Need clear purpose:
   - **Expenses**: Household/personal spending (Mercury, subscriptions, groceries)
   - **AI Usage**: Kate's operational costs (LLM tokens, API calls, daily budget)
3. **Dashboard** — Shows basic cards but doesn't surface the most important daily info

### Missing from Master Plan
Per ea-master-plan-2026.md, these features have NO representation in Kate's Office:
1. **Bennett's Food Tracker** — Solid introduction tracking, food reactions, meal prep
2. **Morning Brief status** — Was it sent? What was in it?
3. **Gift Tracker** — 15+ birthdays, gift status, budget tracking
4. **LLM Radar** — Model leaderboard changes, cost comparisons
5. **Fishing Day Scorer** — Weather + tides for Tue/Thu
6. **Date Night Pipeline** — Restaurant suggestions, reservation status
7. **Subscription Tracker** — All active subscriptions with renewal dates
8. **Mercury Balance** — Real-time bank balance display
9. **Zillow Alerts** — New property listings feed
10. **Murphy Bath Tracker** — Simple rotation tracker
11. **Shopping List** — Shared grocery/household list
12. **Health & Wellness** — Vitamin/supplement reorder tracking

---

## IMPROVEMENT PLAN

### Phase 1: Fix What's Broken (This Sprint)

#### 1.1 Add Missing Backend Endpoints

**Questions API** (`/api/questions`):
```
GET /api/questions - list all question sets
GET /api/questions/today - today's 3 questions
POST /api/questions - create question set (Kate posts daily)
PATCH /api/questions/:id - update answer/status
```
Schema:
```sql
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  question TEXT NOT NULL,
  category TEXT, -- 'getting-to-know', 'preferences', 'planning'
  answer TEXT,
  status TEXT DEFAULT 'pending', -- pending, answered, skipped
  created_at TEXT DEFAULT (datetime('now')),
  answered_at TEXT
);
```

**Cron Jobs API** (`/api/cron`):
```
GET /api/cron - list all cron jobs with status
POST /api/cron/sync - pull from OpenClaw (exec `openclaw cron list --json`)
PATCH /api/cron/:id - update notes/status
```
Schema:
```sql
CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schedule TEXT,
  description TEXT,
  last_run TEXT,
  last_status TEXT, -- success, failed, skipped
  next_run TEXT,
  enabled INTEGER DEFAULT 1,
  category TEXT, -- 'brief', 'birthday', 'trip', 'monitor', 'maintenance'
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Budgets API** (`/api/budgets`):
```
GET /api/budgets - list household budgets
GET /api/budgets/status - budget vs actual summary
POST /api/budgets - create budget category
PATCH /api/budgets/:id - update
```
Schema:
```sql
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- 'household', 'gifts', 'dining', 'travel', 'subscriptions'
  monthly_limit REAL,
  current_spend REAL DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Security API** (`/api/security`):
```
GET /api/security/summary - system health overview
GET /api/security/alerts - recent alerts
GET /api/security/recommendations - pending recommendations
GET /api/security/community - community advisories
```
Schema:
```sql
CREATE TABLE IF NOT EXISTS security_alerts (
  id TEXT PRIMARY KEY,
  type TEXT, -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'new', -- new, acknowledged, resolved
  created_at TEXT DEFAULT (datetime('now'))
);
```

**QAPI Trends** (`/api/qapi/trends`):
Add endpoint that returns weekly incident counts for charting.

#### 1.2 AI Usage Integration
The AI Usage page needs real data. Add a mechanism:
- POST `/api/ai/usage/log` — Kate calls this after each session/interaction with token counts
- The page should show estimated costs based on model pricing (already in the cost calculation helper)
- Add a "last updated" timestamp so Zack knows data is fresh
- Add model breakdown pie chart

#### 1.3 Fix Cron Jobs Page Readability
- Increase font size
- Add color-coded status badges (green=success, red=failed, gray=pending)
- Group by category (briefs, birthdays, trips, monitors)
- Add next run countdown
- Cleaner card layout matching dark theme

#### 1.4 Clarify Expenses vs AI Usage
**Expenses page purpose:** Household & personal spending
- Mercury balance display (prominent)
- Subscription tracker with renewal dates
- Monthly spending by category
- Budget vs actual bars

**AI Usage page purpose:** Kate's operational costs
- Daily token spend vs $40 budget
- Model breakdown (which model used how much)
- 30-day trend
- Active sessions
- Fallback chain status

### Phase 2: Add Missing Master Plan Features

#### 2.1 Bennett's Food Tracker (NEW PAGE)
Add `/bennett` route with BennettTracker page:
- Food introduction log (date, food, reaction: 👍/😐/🤢/⚠️)
- Meal prep schedule
- Pediatric appointment tracker
- Developmental milestones
- Simple, visual, mobile-friendly

Schema:
```sql
CREATE TABLE IF NOT EXISTS bennett_foods (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  food TEXT NOT NULL,
  category TEXT, -- 'fruit', 'vegetable', 'grain', 'protein', 'dairy'
  reaction TEXT, -- 'loved', 'okay', 'disliked', 'allergic'
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bennett_milestones (
  id TEXT PRIMARY KEY,
  date TEXT,
  milestone TEXT NOT NULL,
  category TEXT, -- 'motor', 'language', 'social', 'cognitive'
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

#### 2.2 Gift Tracker (NEW PAGE)
Add `/gifts` route:
- All family members with birthdays
- Gift status pipeline: researching → selected → ordered → shipped → delivered
- Budget tracking per person
- History of past gifts
- Days until next birthday countdown

Schema:
```sql
CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  birthday TEXT,
  budget_min REAL,
  budget_max REAL,
  year INTEGER,
  gift_idea TEXT,
  status TEXT DEFAULT 'upcoming', -- upcoming, researching, selected, ordered, shipped, delivered
  purchase_url TEXT,
  cost REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

#### 2.3 Dashboard Overhaul
The dashboard should be the command center. Show:
- **Today's brief status** (sent/pending, key items)
- **Mercury balance** (prominent number)
- **Next upcoming event** (from calendar)
- **Pending gifts** (approaching birthdays)
- **Active to-dos** (from Kanban)
- **AI budget meter** (daily spend bar)
- **Weather** (current conditions)
- **Recent QAPI incidents** (if any)
- **Unanswered questions** count

#### 2.4 Navigation Update
Add to sidebar:
- Bennett (Baby icon from Lucide)
- Gifts (Gift icon)
Remove dead code: Chat.jsx

### Phase 3: Integration Hooks

#### 3.1 Kate → Kate's Office Data Flow
Create a simple Node.js utility that Kate calls to push data:
- `POST /api/questions` — daily questions at 3:30 PM
- `POST /api/qapi` — when Zack flags a 🚩
- `POST /api/ai/usage/log` — after each interaction
- `POST /api/gifts` — when gift research is done
- `POST /api/bennett_foods` — when food intro is logged
- `PATCH /api/cron/:id` — after cron runs

---

## IMPLEMENTATION ORDER

1. Fix all missing backend endpoints (questions, cron, budgets, security, qapi/trends)
2. Fix Cron Jobs page readability
3. Add Bennett Food Tracker page + API
4. Add Gift Tracker page + API
5. Overhaul Dashboard with real widgets
6. Clarify Expenses vs AI Usage purposes
7. Update navigation (add Bennett, Gifts; remove Chat dead code)
8. Clean up all frontend theme consistency
9. Build frontend, copy to frontend_dist (NOT public), deploy

## BUILD INSTRUCTIONS
- All work in ~/kates-office repo
- Backend: ~/kates-office/backend/server.js (add endpoints, schema migrations)
- Frontend: ~/kates-office/frontend/src/pages/ (React + Tailwind + framer-motion + Recharts + Lucide)
- Match existing dark theme: bg-dark-900, border-dark-600, text-teal for accents, gold for highlights
- IMPORTANT: After frontend build, copy to `frontend_dist` NOT `public`:
  ```
  cd frontend && npm run build && rm -rf ../backend/frontend_dist && cp -r dist ../backend/frontend_dist
  ```
- Test server: `cd backend && timeout 5 node server.js || true`
- When done: `openclaw system event --text 'Done: Kate Office master improvement complete' --mode now`

---

## ADDITIONAL REQUIREMENTS (added during review)

### Gift Tracker Sorting
- Default sort: closest upcoming birthday FIRST
- Show countdown (e.g., "12 days away") prominently

### Friends Section
- Gift tracker must include a FRIENDS section in addition to Family
- Current friends tracked:
  - Jamie Corell — Jan 24 (1979), Pensacola FL, $40-75 budget
  - Nick Miller — Feb 13 (1985), Coloma MI, $40-75 budget
- Same gift pipeline as family: researching → selected → ordered → shipped → delivered
- Friends and Family should be visually grouped/separated (tabs or sections)

### Daily Questions
- Posted to Kate's Office in the MORNING (with 7 AM brief), NOT at 3:30 PM
- 3:30 PM is only a Telegram reminder if questions are still unanswered
