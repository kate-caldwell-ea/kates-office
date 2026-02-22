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

console.log('Starting Kate\'s Office server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);

// ============= TELEGRAM CONFIGURATION =============
// Kate's bot token and target chat for web messages
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8538460545:AAEmkOAdDWduFyHdVre2lJ8-lYW3rsTgU9Q';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6892982410'; // Zack's chat with Kate

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
      console.error('Telegram API error:', result);
      return { success: false, error: result.description };
    }
    
    console.log('Message sent to Telegram successfully');
    return { success: true, messageId: result.result.message_id };
  } catch (error) {
    console.error('Failed to send to Telegram:', error.message);
    return { success: false, error: error.message };
  }
}

// Initialize database
let db;
try {
  // Use /app/data in production (Fly.io volume), local db/ directory otherwise
  const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'db');
  console.log('Data directory:', dataDir);
  
  if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    console.log('Data directory contents:', fs.readdirSync(dataDir));
  } catch (e) {
    console.log('Cannot read data directory:', e.message);
  }
  
  const dbPath = path.join(dataDir, 'kates-office.db');
  console.log('Database path:', dbPath);
  
  db = new Database(dbPath);
  console.log('Database opened successfully');

  // Run schema
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  console.log('Schema path:', schemaPath);
  console.log('Schema exists:', fs.existsSync(schemaPath));
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Schema executed successfully');
} catch (error) {
  console.error('Database initialization error:', error.message);
  console.error('Stack:', error.stack);
  // Try in-memory database as fallback
  console.log('Attempting in-memory database as fallback...');
  try {
    db = new Database(':memory:');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('In-memory database initialized successfully');
  } catch (fallbackError) {
    console.error('Fallback also failed:', fallbackError.message);
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
    console.log('User authenticated successfully');
    res.json({ success: true });
  } else {
    console.log('Failed login attempt');
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
console.log('Serving frontend from:', frontendDistPath);
app.use(express.static(frontendDistPath));

// WebSocket connections for real-time updates
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected');
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
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
      console.error('Failed to forward to Telegram:', telegramResult.error);
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

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏠 Kate's Office server running on port ${PORT}`);
  console.log(`📬 Telegram integration: ${TELEGRAM_BOT_TOKEN ? 'ENABLED' : 'DISABLED'}`);
  console.log(`💬 Target chat ID: ${TELEGRAM_CHAT_ID}\n`);
});
