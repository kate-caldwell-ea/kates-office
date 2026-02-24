const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Production-safe logging - only log in development
const debug = process.env.NODE_ENV !== 'production' ? console.log.bind(console) : () => {};
const debugError = console.error.bind(console); // Always log errors

debug('Starting Kate\'s Office server...');
debug('NODE_ENV:', process.env.NODE_ENV);
debug('Current directory:', __dirname);

// ============= TELEGRAM CONFIGURATION =============
// Kate's bot token and target chat for web messages
// SECURITY: Must be set via environment variables - no hardcoded fallbacks!
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Function to send messages to Telegram
async function sendToTelegram(text, parseMode = 'HTML') {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });
    
    const result = await response.json();
    if (!result.ok) {
      debugError('Telegram API error:', result);
      return { success: false, error: result.description };
    }
    
    debug('Message sent to Telegram successfully');
    return { success: true, messageId: result.result.message_id };
  } catch (error) {
    debugError('Failed to send to Telegram:', error.message);
    return { success: false, error: error.message };
  }
}

// Initialize database
let db;
try {
  // Use /app/data in production (Fly.io volume), local db/ directory otherwise
  const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'db');
  debug('Data directory:', dataDir);
  
  if (!fs.existsSync(dataDir)) {
    debug('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    debug('Data directory contents:', fs.readdirSync(dataDir));
  } catch (e) {
    debug('Cannot read data directory:', e.message);
  }
  
  const dbPath = path.join(dataDir, 'kates-office.db');
  debug('Database path:', dbPath);
  
  db = new Database(dbPath);
  debug('Database opened successfully');

  // Run schema
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  debug('Schema path:', schemaPath);
  debug('Schema exists:', fs.existsSync(schemaPath));
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  debug('Schema executed successfully');

  // Seed default AI budget row
  db.prepare(`INSERT OR IGNORE INTO ai_budget (id, daily_limit_usd, alert_threshold_pct, hard_stop_enabled) VALUES ('default', 40.00, 75.0, 1)`).run();
  debug('AI budget seed data ensured');

  // Migration: Add group_type column to gifts table if missing
  try {
    db.prepare(`ALTER TABLE gifts ADD COLUMN group_type TEXT DEFAULT 'family'`).run();
    debug('Added group_type column to gifts table');
  } catch (e) {
    // Column already exists, ignore
  }

  // Seed gift recipients for current year if none exist
  const currentYear = new Date().getFullYear();
  const existingGifts = db.prepare('SELECT COUNT(*) as count FROM gifts WHERE year = ?').get(currentYear);
  if (existingGifts.count === 0) {
    debug('Seeding gift recipients for ' + currentYear);
    const seedGifts = db.prepare(`
      INSERT OR IGNORE INTO gifts (id, recipient, birthday, budget_min, budget_max, year, status, group_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'upcoming', ?, ?)
    `);
    const seedMany = db.transaction((entries) => {
      for (const e of entries) {
        seedGifts.run(uuidv4(), e.recipient, e.birthday, e.budget_min, e.budget_max, currentYear, e.group_type, e.notes || null);
      }
    });
    seedMany([
      // Family
      { recipient: 'Kamryn', birthday: '02-16', budget_min: 40, budget_max: 60, group_type: 'family', notes: 'Niece' },
      { recipient: 'Marley', birthday: '02-27', budget_min: 30, budget_max: 50, group_type: 'family', notes: 'Great-niece' },
      { recipient: 'Andrew', birthday: '03-02', budget_min: 40, budget_max: 60, group_type: 'family', notes: 'Nephew' },
      { recipient: 'Lisa', birthday: '03-07', budget_min: 60, budget_max: 100, group_type: 'family', notes: 'Mother-in-law' },
      { recipient: 'Morgan', birthday: '03-16', budget_min: 40, budget_max: 60, group_type: 'family', notes: 'Niece' },
      { recipient: 'Carson', birthday: '03-20', budget_min: 40, budget_max: 60, group_type: 'family', notes: 'Nephew' },
      { recipient: 'Chelsea', birthday: '04-04', budget_min: 60, budget_max: 100, group_type: 'family', notes: 'Daughter' },
      { recipient: 'Archer', birthday: '04-20', budget_min: 30, budget_max: 50, group_type: 'family', notes: 'Great-nephew' },
      { recipient: 'Zack', birthday: '06-19', budget_min: 60, budget_max: 100, group_type: 'special', notes: 'Self' },
      { recipient: 'Chase', birthday: '06-19', budget_min: 40, budget_max: 60, group_type: 'family', notes: 'Nephew' },
      { recipient: 'Jake', birthday: '06-29', budget_min: 60, budget_max: 100, group_type: 'family', notes: 'Partner' },
      { recipient: 'Motley', birthday: '07-01', budget_min: 30, budget_max: 50, group_type: 'family', notes: 'Great-nephew' },
      { recipient: 'Megan', birthday: '07-02', budget_min: 40, budget_max: 60, group_type: 'family', notes: 'Niece' },
      { recipient: 'Anniversary', birthday: '07-11', budget_min: 60, budget_max: 100, group_type: 'special', notes: 'Wedding anniversary' },
      { recipient: 'Bennett', birthday: '08-22', budget_min: 60, budget_max: 100, group_type: 'family', notes: 'Son' },
      { recipient: 'Allison', birthday: '08-31', budget_min: 60, budget_max: 100, group_type: 'family', notes: 'Sister' },
      { recipient: 'Michelle', birthday: '09-14', budget_min: 60, budget_max: 100, group_type: 'family', notes: 'Sister' },
      { recipient: 'Blair', birthday: '11-30', budget_min: 60, budget_max: 100, group_type: 'family', notes: 'Sister' },
      { recipient: 'Mikalli', birthday: '12-31', budget_min: 40, budget_max: 60, group_type: 'family', notes: 'Niece' },
      // Friends
      { recipient: 'Jamie Corell', birthday: '01-24', budget_min: 40, budget_max: 75, group_type: 'friend', notes: 'Pensacola FL' },
      { recipient: 'Nick Miller', birthday: '02-13', budget_min: 40, budget_max: 75, group_type: 'friend', notes: 'Coloma MI' },
    ]);
    debug('Seeded ' + 21 + ' gift recipients for ' + currentYear);
  }
} catch (error) {
  debugError('Database initialization error:', error.message);
  debugError('Stack:', error.stack);
  // Try in-memory database as fallback
  debug('Attempting in-memory database as fallback...');
  try {
    db = new Database(':memory:');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    debug('In-memory database initialized successfully');
  } catch (fallbackError) {
    debugError('Fallback also failed:', fallbackError.message);
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ============= AUTH CONFIGURATION =============
const KATES_OFFICE_PASSWORD = process.env.KATES_OFFICE_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!KATES_OFFICE_PASSWORD) {
  console.warn('\n⚠️  WARNING: KATES_OFFICE_PASSWORD not set!');
  console.warn('   The app will be accessible without authentication.');
  console.warn('   Set KATES_OFFICE_PASSWORD env var to enable auth.\n');
}

// Secure password comparison to prevent timing attacks
function secureCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do the comparison to prevent timing attacks
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'kates_office_session',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Auth middleware - checks if user is authenticated
function requireAuth(req, res, next) {
  // If no password is set, allow all access
  if (!KATES_OFFICE_PASSWORD) {
    return next();
  }
  
  // Check if authenticated
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  // Not authenticated
  res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
}

// ============= AUTH ROUTES (public) =============

// Check auth status
app.get('/api/auth/check', (req, res) => {
  if (!KATES_OFFICE_PASSWORD) {
    return res.json({ authenticated: true, authRequired: false });
  }
  res.json({ 
    authenticated: req.session?.authenticated || false,
    authRequired: true
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  
  if (!KATES_OFFICE_PASSWORD) {
    req.session.authenticated = true;
    return res.json({ success: true, message: 'No password required' });
  }
  
  if (secureCompare(password, KATES_OFFICE_PASSWORD)) {
    req.session.authenticated = true;
    debug('User authenticated successfully');
    res.json({ success: true });
  } else {
    debug('Failed login attempt');
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('kates_office_session');
    res.json({ success: true });
  });
});

// ============= PROTECTED ROUTES =============
// Apply auth middleware to all /api routes except /api/auth/*
app.use('/api', (req, res, next) => {
  // Skip auth for auth routes and health check
  if (req.path.startsWith('/auth/') || req.path === '/health') {
    return next();
  }
  requireAuth(req, res, next);
});

// Serve static frontend files (both from frontend_dist and ../frontend/dist for dev)
const frontendDistPath = fs.existsSync(path.join(__dirname, 'frontend_dist'))
  ? path.join(__dirname, 'frontend_dist')
  : path.join(__dirname, '..', 'frontend', 'dist');
debug('Serving frontend from:', frontendDistPath);
app.use(express.static(frontendDistPath));

// WebSocket connections for real-time updates
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  debug('Client connected');
  
  ws.on('close', () => {
    clients.delete(ws);
    debug('Client disconnected');
  });
});

function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function logActivity(type, description, entityType = null, entityId = null) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO activity_log (id, type, description, entity_type, entity_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, type, description, entityType, entityId);
  broadcast('activity', { id, type, description, entityType, entityId });
}

// ============= ASSIGNMENTS API =============

// Get all assignments
app.get('/api/assignments', (req, res) => {
  const { status, includeArchived } = req.query;
  let query = 'SELECT * FROM assignments';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  } else if (!includeArchived) {
    query += " WHERE status != 'archived'";
  }
  
  query += ' ORDER BY position ASC, created_at DESC';
  
  const assignments = db.prepare(query).all(...params);
  
  // Parse tags JSON
  assignments.forEach(a => {
    a.tags = a.tags ? JSON.parse(a.tags) : [];
  });
  
  res.json(assignments);
});

// Get single assignment with comments
app.get('/api/assignments/:id', (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  
  assignment.tags = assignment.tags ? JSON.parse(assignment.tags) : [];
  assignment.comments = db.prepare(
    'SELECT * FROM assignment_comments WHERE assignment_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);
  
  res.json(assignment);
});

// Create assignment
app.post('/api/assignments', (req, res) => {
  const id = uuidv4();
  const { title, description, status = 'inbox', priority = 'normal', due_date, tags = [] } = req.body;
  
  db.prepare(`
    INSERT INTO assignments (id, title, description, status, priority, due_date, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, status, priority, due_date, JSON.stringify(tags));
  
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  assignment.tags = tags;
  
  logActivity('assignment_created', `New assignment: ${title}`, 'assignment', id);
  broadcast('assignment_created', assignment);
  
  res.status(201).json(assignment);
});

// Update assignment
app.patch('/api/assignments/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const current = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Assignment not found' });
  
  const fields = ['title', 'description', 'status', 'priority', 'due_date', 'tags', 'position'];
  const setClause = [];
  const values = [];
  
  fields.forEach(field => {
    if (updates[field] !== undefined) {
      setClause.push(`${field} = ?`);
      values.push(field === 'tags' ? JSON.stringify(updates[field]) : updates[field]);
    }
  });
  
  if (updates.status === 'done' && current.status !== 'done') {
    setClause.push('completed_at = datetime("now")');
  }
  
  setClause.push('updated_at = datetime("now")');
  values.push(id);
  
  db.prepare(`UPDATE assignments SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
  
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  assignment.tags = assignment.tags ? JSON.parse(assignment.tags) : [];
  
  if (updates.status && updates.status !== current.status) {
    logActivity('assignment_status_changed', `${assignment.title}: ${current.status} → ${updates.status}`, 'assignment', id);
  } else {
    logActivity('assignment_updated', `Updated: ${assignment.title}`, 'assignment', id);
  }
  
  broadcast('assignment_updated', assignment);
  res.json(assignment);
});

// Delete assignment
app.delete('/api/assignments/:id', (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  
  logActivity('assignment_deleted', `Deleted: ${assignment.title}`, 'assignment', req.params.id);
  broadcast('assignment_deleted', { id: req.params.id });
  
  res.status(204).send();
});

// Add comment to assignment
app.post('/api/assignments/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content, author = 'zack' } = req.body;
  
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  
  const commentId = uuidv4();
  db.prepare(`
    INSERT INTO assignment_comments (id, assignment_id, author, content)
    VALUES (?, ?, ?, ?)
  `).run(commentId, id, author, content);
  
  const comment = db.prepare('SELECT * FROM assignment_comments WHERE id = ?').get(commentId);
  
  logActivity('comment_added', `Comment on: ${assignment.title}`, 'assignment', id);
  broadcast('comment_added', { assignmentId: id, comment });
  
  res.status(201).json(comment);
});

// ============= EXPENSES API =============

// Get expenses
app.get('/api/expenses', (req, res) => {
  const { from, to, category } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  
  if (from) {
    query += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date <= ?';
    params.push(to);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY date DESC, created_at DESC';
  
  const expenses = db.prepare(query).all(...params);
  res.json(expenses);
});

// Get expense summary
app.get('/api/expenses/summary', (req, res) => {
  const { from, to } = req.query;
  let dateFilter = '';
  const params = [];
  
  if (from) {
    dateFilter += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    dateFilter += ' AND date <= ?';
    params.push(to);
  }
  
  const total = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE 1=1 ${dateFilter}`).get(...params);
  const byCategory = db.prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count 
    FROM expenses WHERE 1=1 ${dateFilter}
    GROUP BY category
  `).all(...params);
  
  res.json({
    total: total?.total || 0,
    byCategory
  });
});

// Create expense
app.post('/api/expenses', (req, res) => {
  const id = uuidv4();
  const { description, amount, currency = 'USD', category, date, vendor, payment_method, notes } = req.body;
  
  db.prepare(`
    INSERT INTO expenses (id, description, amount, currency, category, date, vendor, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, description, amount, currency, category, date || new Date().toISOString().split('T')[0], vendor, payment_method, notes);
  
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  
  logActivity('expense_logged', `$${amount} - ${description}`, 'expense', id);
  broadcast('expense_created', expense);
  
  res.status(201).json(expense);
});

// Update expense
app.patch('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = ['description', 'amount', 'currency', 'category', 'date', 'vendor', 'payment_method', 'notes'];
  const setClause = [];
  const values = [];
  
  fields.forEach(field => {
    if (updates[field] !== undefined) {
      setClause.push(`${field} = ?`);
      values.push(updates[field]);
    }
  });
  
  if (setClause.length === 0) return res.status(400).json({ error: 'No updates provided' });
  
  values.push(id);
  db.prepare(`UPDATE expenses SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
  
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  broadcast('expense_updated', expense);
  
  res.json(expense);
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  broadcast('expense_deleted', { id: req.params.id });
  res.status(204).send();
});

// ============= TOKEN USAGE API =============

// Get token usage
app.get('/api/tokens', (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM token_usage WHERE 1=1';
  const params = [];
  
  if (from) {
    query += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date <= ?';
    params.push(to);
  }
  
  query += ' ORDER BY date DESC';
  
  const usage = db.prepare(query).all(...params);
  res.json(usage);
});

// Get token summary
app.get('/api/tokens/summary', (req, res) => {
  const { from, to } = req.query;
  let dateFilter = '';
  const params = [];
  
  if (from) {
    dateFilter += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    dateFilter += ' AND date <= ?';
    params.push(to);
  }
  
  const summary = db.prepare(`
    SELECT 
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(cost_usd) as total_cost,
      COUNT(*) as sessions
    FROM token_usage WHERE 1=1 ${dateFilter}
  `).get(...params);
  
  const byModel = db.prepare(`
    SELECT 
      model,
      SUM(input_tokens) as input_tokens,
      SUM(output_tokens) as output_tokens,
      SUM(cost_usd) as cost
    FROM token_usage WHERE 1=1 ${dateFilter}
    GROUP BY model
  `).all(...params);
  
  res.json({ ...summary, byModel });
});

// Log token usage
app.post('/api/tokens', (req, res) => {
  const id = uuidv4();
  const { date, model, input_tokens, output_tokens, cost_usd, session_type } = req.body;
  
  db.prepare(`
    INSERT INTO token_usage (id, date, model, input_tokens, output_tokens, cost_usd, session_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, date || new Date().toISOString().split('T')[0], model, input_tokens, output_tokens, cost_usd, session_type);
  
  const usage = db.prepare('SELECT * FROM token_usage WHERE id = ?').get(id);
  res.status(201).json(usage);
});

// ============= CHAT API =============

// Get chat history
app.get('/api/chat', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const messages = db.prepare(`
    SELECT * FROM chat_messages 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(limit).reverse();
  
  messages.forEach(m => {
    m.metadata = m.metadata ? JSON.parse(m.metadata) : null;
  });
  
  res.json(messages);
});

// Send chat message - NOW WITH TELEGRAM INTEGRATION!
app.post('/api/chat', async (req, res) => {
  const id = uuidv4();
  const { role, content, metadata, senderName } = req.body;
  
  // Store the message locally
  db.prepare(`
    INSERT INTO chat_messages (id, role, content, metadata)
    VALUES (?, ?, ?, ?)
  `).run(id, role, content, metadata ? JSON.stringify(metadata) : null);
  
  const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
  message.metadata = message.metadata ? JSON.parse(message.metadata) : null;
  
  // If it's a user message, forward to Kate via Telegram
  if (role === 'user') {
    const displayName = senderName || 'Website Visitor';
    const telegramMessage = `📬 <b>Kate's Office - Web Chat</b>\n\nFrom: ${displayName}\n\n${content}\n\n<i>Reply here and I'll see it. (Web responses coming soon!)</i>`;
    
    const telegramResult = await sendToTelegram(telegramMessage);
    
    // Update message metadata with telegram status
    message.telegramSent = telegramResult.success;
    if (!telegramResult.success) {
      message.telegramError = telegramResult.error;
      debugError('Failed to forward to Telegram:', telegramResult.error);
    }
  }
  
  broadcast('chat_message', message);
  res.status(201).json(message);
});

// ============= QAPI API =============

// Get QAPI incidents
app.get('/api/qapi', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM qapi_incidents';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const incidents = db.prepare(query).all(...params);
  res.json(incidents);
});

// Get QAPI summary
app.get('/api/qapi/summary', (req, res) => {
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM qapi_incidents 
    GROUP BY status
  `).all();
  
  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count 
    FROM qapi_incidents 
    GROUP BY severity
  `).all();
  
  const recent = db.prepare(`
    SELECT * FROM qapi_incidents 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();
  
  res.json({ byStatus, bySeverity, recent });
});

// Create QAPI incident
app.post('/api/qapi', (req, res) => {
  const id = req.body.id || uuidv4();
  const { title, description, severity = 'low', status = 'open' } = req.body;
  
  db.prepare(`
    INSERT INTO qapi_incidents (id, title, description, severity, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title, description, severity, status);
  
  const incident = db.prepare('SELECT * FROM qapi_incidents WHERE id = ?').get(id);
  
  logActivity('qapi_incident_created', `New incident: ${title}`, 'qapi', id);
  broadcast('qapi_incident_created', incident);
  
  res.status(201).json(incident);
});

// Update QAPI incident
app.patch('/api/qapi/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = ['title', 'description', 'severity', 'status', 'root_cause', 'corrective_action'];
  const setClause = [];
  const values = [];
  
  fields.forEach(field => {
    if (updates[field] !== undefined) {
      setClause.push(`${field} = ?`);
      values.push(updates[field]);
    }
  });
  
  if (updates.status === 'resolved' || updates.status === 'closed') {
    setClause.push('resolved_at = datetime("now")');
  }
  
  values.push(id);
  db.prepare(`UPDATE qapi_incidents SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
  
  const incident = db.prepare('SELECT * FROM qapi_incidents WHERE id = ?').get(id);
  broadcast('qapi_incident_updated', incident);
  
  res.json(incident);
});

// ============= ACTIVITY API =============

// Get recent activity
app.get('/api/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const activity = db.prepare(`
    SELECT * FROM activity_log 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(limit);
  res.json(activity);
});

// ============= NOTES API =============

// Get notes
app.get('/api/notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC').all();
  res.json(notes);
});

// Create note
app.post('/api/notes', (req, res) => {
  const id = uuidv4();
  const { content, pinned = false } = req.body;
  
  db.prepare('INSERT INTO notes (id, content, pinned) VALUES (?, ?, ?)').run(id, content, pinned ? 1 : 0);
  
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.status(201).json(note);
});

// Update note
app.patch('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { content, pinned } = req.body;
  
  const updates = [];
  const values = [];
  
  if (content !== undefined) {
    updates.push('content = ?', 'updated_at = datetime("now")');
    values.push(content);
  }
  if (pinned !== undefined) {
    updates.push('pinned = ?');
    values.push(pinned ? 1 : 0);
  }
  
  values.push(id);
  db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.json(note);
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// ============= AI USAGE & COST MANAGEMENT API =============

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

// GET /api/ai/usage/today — today's total usage, cost, budget remaining, % used
app.get('/api/ai/usage/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const budget = db.prepare('SELECT * FROM ai_budget WHERE id = ?').get('default');

  const usage = db.prepare(`
    SELECT
      COALESCE(SUM(input_tokens), 0) as total_input,
      COALESCE(SUM(output_tokens), 0) as total_output,
      COALESCE(SUM(cached_tokens), 0) as total_cached,
      COALESCE(SUM(estimated_cost_usd), 0) as total_cost,
      COUNT(*) as entry_count
    FROM ai_usage_log
    WHERE date(timestamp) = ?
  `).get(today);

  const byModel = db.prepare(`
    SELECT
      model,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(estimated_cost_usd), 0) as cost,
      COUNT(*) as entries
    FROM ai_usage_log
    WHERE date(timestamp) = ?
    GROUP BY model
  `).all(today);

  const bySessionType = db.prepare(`
    SELECT
      session_type,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(estimated_cost_usd), 0) as cost,
      COUNT(*) as entries
    FROM ai_usage_log
    WHERE date(timestamp) = ?
    GROUP BY session_type
  `).all(today);

  const dailyLimit = budget?.daily_limit_usd || 40;
  const totalCost = usage.total_cost || 0;
  const remaining = dailyLimit - totalCost;
  const percentUsed = dailyLimit > 0 ? (totalCost / dailyLimit) * 100 : 0;

  res.json({
    date: today,
    total_input: usage.total_input,
    total_output: usage.total_output,
    total_cached: usage.total_cached,
    total_cost: totalCost,
    entry_count: usage.entry_count,
    daily_limit: dailyLimit,
    remaining,
    percent_used: percentUsed,
    hard_stop_enabled: budget?.hard_stop_enabled === 1,
    override_active: budget?.override_approved_until ? new Date(budget.override_approved_until) > new Date() : false,
    byModel,
    bySessionType,
  });
});

// GET /api/ai/usage/history?days=30 — daily rollup for charting
app.get('/api/ai/usage/history', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = db.prepare(`
    SELECT
      date(timestamp) as date,
      model,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(estimated_cost_usd), 0) as cost,
      COUNT(*) as entries
    FROM ai_usage_log
    WHERE date(timestamp) >= date('now', ?)
    GROUP BY date(timestamp), model
    ORDER BY date(timestamp) ASC
  `).all(`-${days} days`);

  // Also get daily totals
  const dailyTotals = db.prepare(`
    SELECT
      date(timestamp) as date,
      COALESCE(SUM(estimated_cost_usd), 0) as total_cost,
      COALESCE(SUM(input_tokens), 0) as total_input,
      COALESCE(SUM(output_tokens), 0) as total_output
    FROM ai_usage_log
    WHERE date(timestamp) >= date('now', ?)
    GROUP BY date(timestamp)
    ORDER BY date(timestamp) ASC
  `).all(`-${days} days`);

  res.json({ byModelAndDay: history, dailyTotals });
});

// GET /api/ai/budget — current budget settings
app.get('/api/ai/budget', (req, res) => {
  const budget = db.prepare('SELECT * FROM ai_budget WHERE id = ?').get('default');
  if (!budget) {
    return res.json({ id: 'default', daily_limit_usd: 40, alert_threshold_pct: 75, hard_stop_enabled: 1, override_approved_until: null, override_approved_by: null });
  }
  res.json(budget);
});

// PUT /api/ai/budget — update daily limit, alert threshold
app.put('/api/ai/budget', (req, res) => {
  const { daily_limit_usd, alert_threshold_pct, hard_stop_enabled } = req.body;
  const updates = [];
  const values = [];

  if (daily_limit_usd !== undefined) { updates.push('daily_limit_usd = ?'); values.push(daily_limit_usd); }
  if (alert_threshold_pct !== undefined) { updates.push('alert_threshold_pct = ?'); values.push(alert_threshold_pct); }
  if (hard_stop_enabled !== undefined) { updates.push('hard_stop_enabled = ?'); values.push(hard_stop_enabled ? 1 : 0); }

  if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

  updates.push('updated_at = datetime("now")');
  values.push('default');

  db.prepare(`UPDATE ai_budget SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const budget = db.prepare('SELECT * FROM ai_budget WHERE id = ?').get('default');

  logActivity('ai_budget_updated', `AI budget updated: $${budget.daily_limit_usd}/day`, 'ai_budget', 'default');
  res.json(budget);
});

// POST /api/ai/usage/log — log a usage entry
app.post('/api/ai/usage/log', (req, res) => {
  const id = uuidv4();
  const { session_key, model, input_tokens = 0, output_tokens = 0, cached_tokens = 0, session_type, notes } = req.body;

  const cost = estimateCost(model, input_tokens, output_tokens, cached_tokens);

  db.prepare(`
    INSERT INTO ai_usage_log (id, session_key, model, input_tokens, output_tokens, cached_tokens, estimated_cost_usd, session_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, session_key, model, input_tokens, output_tokens, cached_tokens, cost, session_type, notes);

  // Check budget alerts
  const today = new Date().toISOString().split('T')[0];
  const todayTotal = db.prepare(`SELECT COALESCE(SUM(estimated_cost_usd), 0) as total FROM ai_usage_log WHERE date(timestamp) = ?`).get(today);
  const budget = db.prepare('SELECT * FROM ai_budget WHERE id = ?').get('default');

  if (budget && todayTotal) {
    const pctUsed = (todayTotal.total / budget.daily_limit_usd) * 100;
    if (pctUsed >= 90 && pctUsed < 100) {
      const existing = db.prepare(`SELECT id FROM ai_budget_alerts WHERE date = ? AND alert_type = 'warning_90'`).get(today);
      if (!existing) {
        db.prepare(`INSERT INTO ai_budget_alerts (id, date, alert_type, message) VALUES (?, ?, 'warning_90', ?)`).run(uuidv4(), today, `90% of daily budget used ($${todayTotal.total.toFixed(2)}/$${budget.daily_limit_usd})`);
      }
    } else if (pctUsed >= budget.alert_threshold_pct && pctUsed < 90) {
      const existing = db.prepare(`SELECT id FROM ai_budget_alerts WHERE date = ? AND alert_type = 'warning_75'`).get(today);
      if (!existing) {
        db.prepare(`INSERT INTO ai_budget_alerts (id, date, alert_type, message) VALUES (?, ?, 'warning_75', ?)`).run(uuidv4(), today, `${budget.alert_threshold_pct}% of daily budget used ($${todayTotal.total.toFixed(2)}/$${budget.daily_limit_usd})`);
      }
    }
    if (pctUsed >= 100 && budget.hard_stop_enabled) {
      const existing = db.prepare(`SELECT id FROM ai_budget_alerts WHERE date = ? AND alert_type = 'hard_stop'`).get(today);
      if (!existing) {
        db.prepare(`INSERT INTO ai_budget_alerts (id, date, alert_type, message) VALUES (?, ?, 'hard_stop', ?)`).run(uuidv4(), today, `Daily budget exceeded — hard stop triggered ($${todayTotal.total.toFixed(2)}/$${budget.daily_limit_usd})`);
      }
    }
  }

  const entry = db.prepare('SELECT * FROM ai_usage_log WHERE id = ?').get(id);
  broadcast('ai_usage_logged', entry);
  res.status(201).json(entry);
});

// POST /api/ai/budget/override — grant temporary override
app.post('/api/ai/budget/override', (req, res) => {
  const { approved_by = 'zack', duration_hours = 4 } = req.body;
  const until = new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString();

  db.prepare(`UPDATE ai_budget SET override_approved_until = ?, override_approved_by = ?, updated_at = datetime('now') WHERE id = 'default'`).run(until, approved_by);

  const alertId = uuidv4();
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`INSERT INTO ai_budget_alerts (id, date, alert_type, message) VALUES (?, ?, 'override_granted', ?)`).run(alertId, today, `Budget override granted by ${approved_by} until ${until}`);

  logActivity('ai_budget_override', `AI budget override granted by ${approved_by} for ${duration_hours}h`, 'ai_budget', 'default');

  const budget = db.prepare('SELECT * FROM ai_budget WHERE id = ?').get('default');
  res.json({ success: true, budget, override_until: until });
});

// GET /api/ai/usage/sessions — active sessions with estimated burn rate
app.get('/api/ai/usage/sessions', (req, res) => {
  // Get sessions active in the last 30 minutes
  const sessions = db.prepare(`
    SELECT
      session_key,
      model,
      session_type,
      MIN(timestamp) as started_at,
      MAX(timestamp) as last_activity,
      COALESCE(SUM(input_tokens), 0) as total_input,
      COALESCE(SUM(output_tokens), 0) as total_output,
      COALESCE(SUM(cached_tokens), 0) as total_cached,
      COALESCE(SUM(estimated_cost_usd), 0) as total_cost,
      COUNT(*) as entries
    FROM ai_usage_log
    WHERE timestamp >= datetime('now', '-30 minutes')
      AND session_key IS NOT NULL
    GROUP BY session_key
    ORDER BY last_activity DESC
  `).all();

  // Calculate burn rate for each session
  const enriched = sessions.map(s => {
    const durationMin = Math.max(1, (new Date(s.last_activity) - new Date(s.started_at)) / 60000);
    const tokensPerMin = (s.total_input + s.total_output) / durationMin;
    const costPerHour = (s.total_cost / durationMin) * 60;
    return {
      ...s,
      duration_minutes: Math.round(durationMin),
      tokens_per_minute: Math.round(tokensPerMin),
      cost_per_hour: costPerHour,
    };
  });

  res.json(enriched);
});

// GET /api/ai/models — current model config
app.get('/api/ai/models', (req, res) => {
  res.json({
    primary: { model: 'claude-opus-4-6', status: 'active', role: 'Primary' },
    fallbacks: [
      { model: 'claude-sonnet-4-6', status: 'standby', role: 'Fallback 1' },
      { model: 'gpt-4.1', status: 'standby', role: 'Fallback 2' },
    ],
    cron: { model: 'claude-sonnet-4-6', status: 'active', role: 'Cron Tasks' },
  });
});

// GET /api/ai/alerts — recent budget alerts
app.get('/api/ai/alerts', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const alerts = db.prepare(`
    SELECT * FROM ai_budget_alerts
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
  res.json(alerts);
});

// ============= HEALTH CHECK =============

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    features: {
      telegram: !!TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID ? 'configured' : 'not configured'
    }
  });
});

// ============= TELEGRAM STATUS =============
app.get('/api/chat/status', (req, res) => {
  res.json({
    telegramEnabled: !!TELEGRAM_BOT_TOKEN,
    chatIdConfigured: !!TELEGRAM_CHAT_ID,
    note: 'Messages sent here are forwarded to Kate via Telegram. Responses will appear in Telegram.'
  });
});

// Simplified chat send endpoint (for frontend compatibility)
app.post('/api/chat/send', async (req, res) => {
  const { content, senderName } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }
  
  const id = uuidv4();
  
  // Store the user message
  db.prepare(`
    INSERT INTO chat_messages (id, role, content, metadata)
    VALUES (?, ?, ?, ?)
  `).run(id, 'user', content, JSON.stringify({ source: 'web', senderName }));
  
  const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
  message.metadata = message.metadata ? JSON.parse(message.metadata) : null;
  
  // Forward to Telegram
  const displayName = senderName || 'Website Visitor';
  const telegramMessage = `📬 <b>Kate's Office - Web Chat</b>\n\nFrom: ${displayName}\n\n${content}\n\n<i>Reply here and I'll see it. (Web responses coming soon!)</i>`;
  
  const telegramResult = await sendToTelegram(telegramMessage);
  
  // Broadcast to connected clients
  broadcast('chat_message', message);
  
  // Log activity
  logActivity('chat_message_sent', `Web message from ${displayName}`, 'chat', id);
  
  if (telegramResult.success) {
    // Add confirmation message
    const confirmId = uuidv4();
    const confirmContent = `✅ Message forwarded to Kate via Telegram! I'll respond there, and responses will show here soon.`;
    
    db.prepare(`
      INSERT INTO chat_messages (id, role, content, metadata)
      VALUES (?, ?, ?, ?)
    `).run(confirmId, 'assistant', confirmContent, JSON.stringify({ type: 'system_confirm', telegramMessageId: telegramResult.messageId }));
    
    const confirmMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(confirmId);
    confirmMessage.metadata = confirmMessage.metadata ? JSON.parse(confirmMessage.metadata) : null;
    
    broadcast('chat_message', confirmMessage);
    
    res.json({ success: true, messageId: id, telegramSent: true });
  } else {
    // Add error message
    const errorId = uuidv4();
    const errorContent = `⚠️ Couldn't reach Telegram right now. Your message was saved and will be retried later.`;
    
    db.prepare(`
      INSERT INTO chat_messages (id, role, content, metadata)
      VALUES (?, ?, ?, ?)
    `).run(errorId, 'system', errorContent, JSON.stringify({ type: 'system_error', error: telegramResult.error }));
    
    const errorMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(errorId);
    errorMessage.metadata = errorMessage.metadata ? JSON.parse(errorMessage.metadata) : null;
    
    broadcast('chat_message', errorMessage);
    
    res.json({ success: true, messageId: id, telegramSent: false, error: telegramResult.error });
  }
});

// ============= FAMILY API (reads from workspace files) =============

// Workspace path - configurable via env for different deployments
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || '/data/workspace';

// Parse family data from USER.md and gift-tracker-2026.md
function parseFamilyData() {
  const family = {
    immediate: [],
    extended: [],
    greatNiecesNephews: []
  };
  
  try {
    // Read gift tracker for status info
    const giftTrackerPath = path.join(WORKSPACE_PATH, 'reference', 'gift-tracker-2026.md');
    let giftData = {};
    
    if (fs.existsSync(giftTrackerPath)) {
      const giftContent = fs.readFileSync(giftTrackerPath, 'utf8');
      // Parse gift status from markdown table
      const lines = giftContent.split('\n');
      for (const line of lines) {
        if (line.startsWith('|') && !line.includes('Date') && !line.includes('---')) {
          const cols = line.split('|').map(c => c.trim()).filter(c => c);
          if (cols.length >= 5) {
            const person = cols[1];
            const status = cols[4].includes('DONE') ? 'done' : 
                          cols[4].includes('SKIP') ? 'skip' :
                          cols[4].includes('Progress') ? 'in_progress' : 'needed';
            const notes = cols[5] || '';
            giftData[person.toLowerCase()] = { status, notes, budget: cols[3] };
          }
        }
      }
    }
    
    // Hard-coded family structure (from USER.md) with dynamic gift status
    const familyMembers = [
      // Immediate
      { id: 'jake', name: 'Jake', relation: 'Partner', birthday: '1991-06-29', category: 'immediate', emoji: '💕' },
      { id: 'bennett', name: 'Bennett', relation: 'Child', birthday: '2025-08-22', category: 'immediate', emoji: '👶' },
      { id: 'chelsea', name: 'Chelsea', relation: 'Daughter', birthday: '2003-04-04', category: 'immediate', emoji: '🎓', notes: 'OMS 1 at VCOM Carolinas' },
      // Extended
      { id: 'lisa', name: 'Lisa Roberts Milo', relation: 'Mother-in-law', birthday: '03-07', category: 'extended', emoji: '🏠' },
      { id: 'allison', name: 'Allison Sharpe McMillan', relation: 'Sister', birthday: '08-31', category: 'extended', emoji: '👩', address: '262 Itsa Road, Cleveland, GA 30528' },
      { id: 'morgan', name: 'Morgan Fox', relation: 'Niece', birthday: '2001-03-16', category: 'extended', emoji: '👩‍⚕️', notes: 'L&D nurse, married to Austin Fox' },
      { id: 'megan', name: 'Megan McMillan', relation: 'Niece', birthday: '1997-07-02', category: 'extended', emoji: '👩' },
      { id: 'kamryn', name: 'Kamryn Miller', relation: 'Niece', birthday: '2010-02-16', category: 'extended', emoji: '👧', address: '506 Thomson Road, Washington, GA 30673' },
      { id: 'andrew', name: 'Andrew Miller', relation: 'Nephew', birthday: '1996-03-02', category: 'extended', emoji: '👨' },
      { id: 'mikalli', name: 'Mikalli McMillan', relation: 'Niece', birthday: '12-31', category: 'extended', emoji: '🎆' },
      // Great nieces/nephews
      { id: 'marley', name: 'Marley', relation: 'Great-niece', birthday: '2015-02-27', category: 'greatNiecesNephews', emoji: '🎀', parentId: 'megan' },
      { id: 'archer', name: 'Archer', relation: 'Great-nephew', birthday: '2022-04-20', category: 'greatNiecesNephews', emoji: '🏹', parentId: 'megan' },
      { id: 'motley', name: 'Motley Laine Fox', relation: 'Great-nephew', birthday: '2025-07-01', category: 'greatNiecesNephews', emoji: '🍼', parentId: 'morgan' },
    ];
    
    for (const member of familyMembers) {
      const giftInfo = giftData[member.name.toLowerCase().split(' ')[0]] || { status: 'needed', notes: '', budget: 'TBD' };
      const enriched = {
        ...member,
        giftStatus: giftInfo.status,
        giftNotes: giftInfo.notes,
        giftBudget: giftInfo.budget
      };
      family[member.category].push(enriched);
    }
    
  } catch (error) {
    debugError('Error parsing family data:', error.message);
  }
  
  return family;
}

app.get('/api/family', (req, res) => {
  const data = parseFamilyData();
  res.json(data);
});

// ============= TRIPS API (reads from workspace files) =============

function parseTripsData() {
  const trips = [];
  
  try {
    const tripsPath = path.join(WORKSPACE_PATH, 'reference', 'upcoming-personal-2026.md');
    
    if (fs.existsSync(tripsPath)) {
      const content = fs.readFileSync(tripsPath, 'utf8');
      
      // Parse cruise and international trips from markdown
      // Chelsea's Birthday Cruise
      if (content.includes('Mar 29 - Apr 3')) {
        trips.push({
          id: 1,
          name: "Chelsea's Birthday Cruise",
          type: 'cruise',
          destination: 'Caribbean',
          ship: 'Celebrity Reflection',
          startDate: '2026-03-29',
          endDate: '2026-04-03',
          travelers: ['Zack', 'Jake', 'Chelsea'],
          occasion: "Chelsea's 23rd Birthday! 🎂",
          confirmations: { cruise: '8979513', flight: 'GDDTR9' },
          status: 'upcoming'
        });
      }
      
      // Celebrity Summit Cruise
      if (content.includes('Apr 8-14')) {
        trips.push({
          id: 2,
          name: 'Celebrity Summit Cruise + Fort Lauderdale',
          type: 'cruise',
          destination: 'Caribbean',
          ship: 'Celebrity Summit',
          startDate: '2026-04-08',
          endDate: '2026-04-14',
          travelers: ['Zack', 'Jake'],
          occasion: 'Spring getaway ☀️',
          confirmations: { cruise: '2977019', flight: 'H5SZIW' },
          status: 'upcoming'
        });
      }
      
      // Lake Como
      if (content.includes('Jun 23 - Jul 1')) {
        trips.push({
          id: 3,
          name: "Lake Como — Jake's Birthday",
          type: 'international',
          destination: 'Lake Como, Italy',
          startDate: '2026-06-23',
          endDate: '2026-07-01',
          travelers: ['Zack', 'Jake'],
          occasion: "Jake's 35th Birthday! 🎂🇮🇹",
          confirmations: { flight: 'GZ4T38' },
          status: 'upcoming'
        });
      }
    }
  } catch (error) {
    debugError('Error parsing trips data:', error.message);
  }
  
  return trips;
}

app.get('/api/trips', (req, res) => {
  const data = parseTripsData();
  res.json(data);
});

// ============= QUESTIONS API =============

// Get all question sets
app.get('/api/questions', (req, res) => {
  const sets = db.prepare(`
    SELECT * FROM daily_questions ORDER BY date DESC LIMIT 30
  `).all();
  sets.forEach(s => {
    s.questions = s.questions ? JSON.parse(s.questions) : [];
    s.answers = s.answers ? JSON.parse(s.answers) : [];
  });
  res.json(sets);
});

// Get today's questions
app.get('/api/questions/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const set = db.prepare('SELECT * FROM daily_questions WHERE date = ?').get(today);
  if (!set) return res.json(null);
  set.questions = set.questions ? JSON.parse(set.questions) : [];
  set.answers = set.answers ? JSON.parse(set.answers) : [];
  res.json(set);
});

// Create question set (Kate posts daily)
app.post('/api/questions', (req, res) => {
  const id = req.body.id || uuidv4();
  const { date, questions } = req.body;
  const dateVal = date || new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO daily_questions (id, date, questions)
    VALUES (?, ?, ?)
  `).run(id, dateVal, JSON.stringify(questions));

  const set = db.prepare('SELECT * FROM daily_questions WHERE id = ?').get(id);
  set.questions = JSON.parse(set.questions);
  set.answers = set.answers ? JSON.parse(set.answers) : [];

  logActivity('questions_created', `New daily questions for ${dateVal}`, 'questions', id);
  broadcast('questions_created', set);

  res.status(201).json(set);
});

// Update answers/status
app.patch('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const { answers, status } = req.body;
  const updates = [];
  const values = [];

  if (answers !== undefined) { updates.push('answers = ?'); values.push(JSON.stringify(answers)); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (status === 'answered') { updates.push('answered_at = datetime("now")'); }

  if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

  values.push(id);
  db.prepare(`UPDATE daily_questions SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const set = db.prepare('SELECT * FROM daily_questions WHERE id = ?').get(id);
  if (!set) return res.status(404).json({ error: 'Question set not found' });
  set.questions = set.questions ? JSON.parse(set.questions) : [];
  set.answers = set.answers ? JSON.parse(set.answers) : [];

  logActivity('questions_answered', `Answered daily questions`, 'questions', id);
  res.json(set);
});

// ============= CRON JOBS API =============

// Get all cron jobs
app.get('/api/cron', (req, res) => {
  const jobs = db.prepare('SELECT * FROM cron_jobs ORDER BY next_run ASC').all();
  jobs.forEach(j => {
    j.schedule = j.schedule ? JSON.parse(j.schedule) : {};
  });
  res.json(jobs);
});

// Sync from OpenClaw
app.post('/api/cron/sync', (req, res) => {
  try {
    const { execSync } = require('child_process');
    let output;
    try {
      output = execSync('openclaw cron list --json', { timeout: 10000, encoding: 'utf8' });
    } catch (e) {
      // If openclaw isn't available, return current jobs
      const jobs = db.prepare('SELECT * FROM cron_jobs ORDER BY next_run ASC').all();
      jobs.forEach(j => { j.schedule = j.schedule ? JSON.parse(j.schedule) : {}; });
      return res.json({ synced: false, message: 'OpenClaw not available', jobs });
    }

    const cronData = JSON.parse(output);
    const now = new Date().toISOString();

    const upsert = db.prepare(`
      INSERT INTO cron_jobs (id, name, schedule, next_run, last_run, last_status, enabled, payload_summary, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, schedule=excluded.schedule, next_run=excluded.next_run,
        last_run=excluded.last_run, last_status=excluded.last_status, enabled=excluded.enabled,
        payload_summary=excluded.payload_summary, synced_at=excluded.synced_at
    `);

    const syncMany = db.transaction((items) => {
      for (const item of items) {
        upsert.run(
          item.id, item.name, JSON.stringify(item.schedule || {}),
          item.next_run || null, item.last_run || null, item.last_status || null,
          item.enabled !== false ? 1 : 0, item.payload_summary || item.name, now
        );
      }
    });

    syncMany(Array.isArray(cronData) ? cronData : []);

    const jobs = db.prepare('SELECT * FROM cron_jobs ORDER BY next_run ASC').all();
    jobs.forEach(j => { j.schedule = j.schedule ? JSON.parse(j.schedule) : {}; });

    logActivity('cron_synced', `Synced ${jobs.length} cron jobs from OpenClaw`, 'cron', null);
    res.json({ synced: true, count: jobs.length, jobs });
  } catch (err) {
    debugError('Cron sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync cron jobs', details: err.message });
  }
});

// Update cron job notes/status
app.patch('/api/cron/:id', (req, res) => {
  const { id } = req.params;
  const { last_status, last_run, enabled, next_run } = req.body;
  const updates = [];
  const values = [];

  if (last_status !== undefined) { updates.push('last_status = ?'); values.push(last_status); }
  if (last_run !== undefined) { updates.push('last_run = ?'); values.push(last_run); }
  if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled ? 1 : 0); }
  if (next_run !== undefined) { updates.push('next_run = ?'); values.push(next_run); }
  updates.push('synced_at = datetime("now")');

  values.push(id);
  db.prepare(`UPDATE cron_jobs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const job = db.prepare('SELECT * FROM cron_jobs WHERE id = ?').get(id);
  if (job) job.schedule = job.schedule ? JSON.parse(job.schedule) : {};
  res.json(job);
});

// ============= BUDGETS API =============

// Get all budgets
app.get('/api/budgets', (req, res) => {
  const budgets = db.prepare('SELECT * FROM budgets ORDER BY name ASC').all();
  res.json(budgets);
});

// Get budget status (with actual spending)
app.get('/api/budgets/status', (req, res) => {
  const budgets = db.prepare('SELECT * FROM budgets ORDER BY name ASC').all();
  const now = new Date();

  const result = budgets.map(budget => {
    let dateFilter = '';
    const params = [];

    if (budget.period === 'monthly') {
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      dateFilter = 'AND date >= ?';
      params.push(startOfMonth);
    } else if (budget.period === 'weekly') {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      dateFilter = 'AND date >= ?';
      params.push(startOfWeek.toISOString().split('T')[0]);
    } else if (budget.period === 'yearly') {
      dateFilter = 'AND date >= ?';
      params.push(`${now.getFullYear()}-01-01`);
    }

    let categoryFilter = '';
    if (budget.category) {
      categoryFilter = 'AND category = ?';
      params.push(budget.category);
    }

    const spent = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE 1=1 ${dateFilter} ${categoryFilter}
    `).get(...params);

    const spentAmount = spent.total || 0;
    const remaining = budget.amount - spentAmount;
    const percentage = budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0;
    const status = percentage >= 100 ? 'exceeded' : percentage >= (budget.alert_threshold * 100) ? 'warning' : 'ok';

    return {
      ...budget,
      spent: spentAmount,
      remaining,
      percentage,
      status,
    };
  });

  res.json(result);
});

// Create budget
app.post('/api/budgets', (req, res) => {
  const id = uuidv4();
  const { name, category, amount, period = 'monthly', alert_threshold = 0.8 } = req.body;

  db.prepare(`
    INSERT INTO budgets (id, name, category, amount, period, alert_threshold)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, category || null, amount, period, alert_threshold);

  const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  logActivity('budget_created', `New budget: ${name} ($${amount}/${period})`, 'budget', id);
  res.status(201).json(budget);
});

// Update budget
app.patch('/api/budgets/:id', (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'category', 'amount', 'period', 'alert_threshold'];
  const setClause = [];
  const values = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      setClause.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (setClause.length === 0) return res.status(400).json({ error: 'No updates provided' });
  setClause.push('updated_at = datetime("now")');
  values.push(id);

  db.prepare(`UPDATE budgets SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
  const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  res.json(budget);
});

// Delete budget
app.delete('/api/budgets/:id', (req, res) => {
  db.prepare('DELETE FROM budgets WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// ============= EXPENSES TRENDS API =============

app.get('/api/expenses/trends', (req, res) => {
  const days = parseInt(req.query.days) || 30;

  const trends = db.prepare(`
    SELECT date as period, SUM(amount) as total, COUNT(*) as count
    FROM expenses
    WHERE date >= date('now', ?)
    GROUP BY date
    ORDER BY date ASC
  `).all(`-${days} days`);

  const byCategory = db.prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM expenses
    WHERE date >= date('now', ?)
    GROUP BY category
    ORDER BY total DESC
  `).all(`-${days} days`);

  res.json({ trends, byCategory });
});

// ============= SECURITY API =============

// Security summary
app.get('/api/security/summary', (req, res) => {
  const criticalAlerts = db.prepare(`SELECT COUNT(*) as count FROM security_alerts WHERE severity = 'critical' AND status != 'resolved'`).get().count;
  const activeAlerts = db.prepare(`SELECT COUNT(*) as count FROM security_alerts WHERE status != 'resolved'`).get().count;
  const pendingRecommendations = db.prepare(`SELECT COUNT(*) as count FROM security_recommendations WHERE status = 'pending'`).get().count;
  const recentIssues = db.prepare(`SELECT COUNT(*) as count FROM security_community_issues WHERE created_at >= datetime('now', '-7 days')`).get().count;

  // QAPI correlations
  const qapiCorrelations = db.prepare(`SELECT COUNT(*) as count FROM security_community_issues WHERE qapi_correlation IS NOT NULL`).get().count;

  // Latest report info
  const latestAlert = db.prepare(`SELECT created_at as date FROM security_alerts ORDER BY created_at DESC LIMIT 1`).get();

  res.json({
    criticalAlerts,
    activeAlerts,
    pendingRecommendations,
    recentIssues,
    qapiCorrelations,
    latestReport: latestAlert ? { date: latestAlert.date, summary: `${activeAlerts} active alerts, ${pendingRecommendations} pending recommendations` } : null,
  });
});

// Security alerts
app.get('/api/security/alerts', (req, res) => {
  const alerts = db.prepare(`SELECT * FROM security_alerts WHERE status != 'resolved' ORDER BY created_at DESC`).all();
  res.json(alerts);
});

// Community issues
app.get('/api/security/community', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const issues = db.prepare(`SELECT * FROM security_community_issues ORDER BY created_at DESC LIMIT ?`).all(limit);
  res.json(issues);
});

// Recommendations
app.get('/api/security/recommendations', (req, res) => {
  const status = req.query.status;
  let query = 'SELECT * FROM security_recommendations';
  const params = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const recs = db.prepare(query).all(...params);
  res.json(recs);
});

// QAPI Correlations
app.get('/api/security/correlations', (req, res) => {
  const corrs = db.prepare(`
    SELECT sci.*, qi.title as qapi_title, qi.status as qapi_status
    FROM security_community_issues sci
    LEFT JOIN qapi_incidents qi ON sci.qapi_correlation = qi.id
    WHERE sci.qapi_correlation IS NOT NULL
    ORDER BY sci.created_at DESC
  `).all();
  res.json(corrs);
});

// Update recommendation status
app.patch('/api/security/recommendations/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare('UPDATE security_recommendations SET status = ? WHERE id = ?').run(status, id);
  const rec = db.prepare('SELECT * FROM security_recommendations WHERE id = ?').get(id);
  res.json(rec);
});

// ============= QAPI TRENDS API =============

app.get('/api/qapi/trends', (req, res) => {
  const days = parseInt(req.query.days) || 180;

  const trends = db.prepare(`
    SELECT
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high
    FROM qapi_incidents
    WHERE created_at >= date('now', ?)
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month ASC
  `).all(`-${days} days`);

  // Average resolution time
  const resolved = db.prepare(`
    SELECT AVG(julianday(resolved_at) - julianday(created_at)) as avg_days
    FROM qapi_incidents
    WHERE resolved_at IS NOT NULL AND created_at >= date('now', ?)
  `).get(`-${days} days`);

  res.json({
    trends,
    avgResolutionDays: resolved?.avg_days ? Math.round(resolved.avg_days * 10) / 10 : null,
  });
});

// ============= BENNETT TRACKER API =============

// Get all foods
app.get('/api/bennett/foods', (req, res) => {
  const foods = db.prepare('SELECT * FROM bennett_foods ORDER BY date DESC').all();
  res.json(foods);
});

// Add food
app.post('/api/bennett/foods', (req, res) => {
  const id = uuidv4();
  const { date, food, category, reaction, notes } = req.body;

  db.prepare(`
    INSERT INTO bennett_foods (id, date, food, category, reaction, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, date || new Date().toISOString().split('T')[0], food, category || null, reaction || null, notes || null);

  const entry = db.prepare('SELECT * FROM bennett_foods WHERE id = ?').get(id);
  logActivity('bennett_food_added', `New food intro: ${food}`, 'bennett', id);
  broadcast('bennett_food_added', entry);
  res.status(201).json(entry);
});

// Update food entry
app.patch('/api/bennett/foods/:id', (req, res) => {
  const { id } = req.params;
  const fields = ['date', 'food', 'category', 'reaction', 'notes'];
  const setClause = [];
  const values = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      setClause.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (setClause.length === 0) return res.status(400).json({ error: 'No updates provided' });
  values.push(id);
  db.prepare(`UPDATE bennett_foods SET ${setClause.join(', ')} WHERE id = ?`).run(...values);

  const entry = db.prepare('SELECT * FROM bennett_foods WHERE id = ?').get(id);
  res.json(entry);
});

// Delete food entry
app.delete('/api/bennett/foods/:id', (req, res) => {
  db.prepare('DELETE FROM bennett_foods WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// Get all milestones
app.get('/api/bennett/milestones', (req, res) => {
  const milestones = db.prepare('SELECT * FROM bennett_milestones ORDER BY date DESC').all();
  res.json(milestones);
});

// Add milestone
app.post('/api/bennett/milestones', (req, res) => {
  const id = uuidv4();
  const { date, milestone, category, notes } = req.body;

  db.prepare(`
    INSERT INTO bennett_milestones (id, date, milestone, category, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, date || null, milestone, category || null, notes || null);

  const entry = db.prepare('SELECT * FROM bennett_milestones WHERE id = ?').get(id);
  logActivity('bennett_milestone', `Milestone: ${milestone}`, 'bennett', id);
  broadcast('bennett_milestone', entry);
  res.status(201).json(entry);
});

// Delete milestone
app.delete('/api/bennett/milestones/:id', (req, res) => {
  db.prepare('DELETE FROM bennett_milestones WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// ============= GIFTS API =============

// Get all gifts
app.get('/api/gifts', (req, res) => {
  const { year, recipient } = req.query;
  let query = 'SELECT * FROM gifts WHERE 1=1';
  const params = [];

  if (year) { query += ' AND year = ?'; params.push(parseInt(year)); }
  if (recipient) { query += ' AND recipient = ?'; params.push(recipient); }

  query += ' ORDER BY birthday ASC, created_at DESC';
  const gifts = db.prepare(query).all(...params);
  res.json(gifts);
});

// Create gift entry
app.post('/api/gifts', (req, res) => {
  const id = uuidv4();
  const { recipient, birthday, budget_min, budget_max, year, gift_idea, status, purchase_url, cost, notes, group_type } = req.body;

  db.prepare(`
    INSERT INTO gifts (id, recipient, birthday, budget_min, budget_max, year, gift_idea, status, purchase_url, cost, notes, group_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, recipient, birthday || null, budget_min || null, budget_max || null,
    year || new Date().getFullYear(), gift_idea || null, status || 'upcoming',
    purchase_url || null, cost || null, notes || null, group_type || 'family');

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(id);
  logActivity('gift_added', `Gift for ${recipient}: ${gift_idea || 'TBD'}`, 'gift', id);
  broadcast('gift_added', gift);
  res.status(201).json(gift);
});

// Update gift
app.patch('/api/gifts/:id', (req, res) => {
  const { id } = req.params;
  const fields = ['recipient', 'birthday', 'budget_min', 'budget_max', 'year', 'gift_idea', 'status', 'purchase_url', 'cost', 'notes', 'group_type'];
  const setClause = [];
  const values = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      setClause.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (setClause.length === 0) return res.status(400).json({ error: 'No updates provided' });
  setClause.push('updated_at = datetime("now")');
  values.push(id);

  db.prepare(`UPDATE gifts SET ${setClause.join(', ')} WHERE id = ?`).run(...values);

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(id);
  broadcast('gift_updated', gift);
  res.json(gift);
});

// Delete gift
app.delete('/api/gifts/:id', (req, res) => {
  db.prepare('DELETE FROM gifts WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  debug(`\n🏠 Kate's Office server running on port ${PORT}`);
  debug(`📬 Telegram integration: ${TELEGRAM_BOT_TOKEN ? 'ENABLED' : 'DISABLED'}`);
  debug(`💬 Target chat ID: ${TELEGRAM_CHAT_ID}\n`);
});
