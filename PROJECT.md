# Kate's Office 🏠

A personal command center for Zack to manage projects, communicate with Kate, and track everything important.

## Vision

Kate's Office should feel like walking into an actual executive assistant's office — warm, organized, professional, with personal touches that make it uniquely Kate's space. Not a sterile dashboard, but a place where work gets done with personality.

## Core Features

### 1. Kanban Board ("The Board")
- Projects and assignments organized by status
- Statuses: Inbox, In Progress, Blocked, Waiting, Done
- Add, edit, archive assignments
- Comments and activity history on each item
- Priority levels (urgent, high, normal, low)
- Due dates with visual indicators
- Tags/categories

### 2. Chat Interface ("Kate's Desk")
- Real-time text chat with Kate
- Voice input (speech-to-text)
- Voice output (Kate speaks responses via TTS)
- Message history
- Quick actions from chat
- Typing indicators

### 3. Expense Tracker ("The Ledger")
- Transaction list with categories
- Running totals and budgets
- Token/API usage tracking with costs
- Charts and trends
- Export capabilities

### 4. QAPI Dashboard ("Quality Corner")
- Active incidents
- Investigation status
- Trend analysis
- Performance metrics
- Incident timeline

### 5. Quick Actions Panel
- One-click common tasks
- Create new assignment
- Log expense
- Send to Kate
- Voice note

### 6. Activity Feed
- Recent actions across all areas
- What Kate's been working on
- Updates on assignments

### 7. Extras (Kate's Personal Touches)
- Office "decor" - photos, plants, personality
- Weather widget
- Upcoming events/birthdays
- Travel countdown
- Daily briefing section
- Inspirational quotes Kate likes

## Tech Stack

- **Frontend:** React 18 + Vite
- **UI:** Tailwind CSS + Headless UI
- **State:** Zustand
- **Backend:** Express.js API
- **Database:** SQLite (simple, portable)
- **Real-time:** WebSocket for chat
- **Voice:** Web Speech API + OpenClaw TTS

## Project Structure

```
kates-office/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── styles/
│   └── public/
├── backend/            # Express API
│   ├── routes/
│   ├── services/
│   └── db/
├── assets/             # Kate's office decor
└── docs/
```

## Design Philosophy

- Warm, inviting color palette (not cold corporate)
- Thoughtful micro-interactions
- Clear visual hierarchy
- Mobile-responsive
- Fast and snappy
- Personality without being cheesy

## Status

🚧 Under Construction - Building with love!
