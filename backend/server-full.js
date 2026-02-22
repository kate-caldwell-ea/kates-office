const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const initSqlJs = require('sql.js');
const DatabaseWrapper = require('./db-wrapper');

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
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Auth middleware
function requireAuth(req, res, next) {
  if (!KATES_OFFICE_PASSWORD) return next();
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
}

console.log('Starting Kate\'s Office server...');
console.log('NODE_ENV:', process.env.NODE_ENV);

// ============= TELEGRAM CONFIGURATION =============
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

let db;

async function initDatabase() {
  console.log('Initializing sql.js...');
  const SQL = await initSqlJs();
  
  // Use /app/data in production (Fly.io volume), local db/ directory otherwise
  const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'db');
  const dbPath = path.join(dataDir, 'kates-office.db');
  
  let rawDb;
  
  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    console.log('Loading existing database from:', dbPath);
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(fileBuffer);
      console.log('Existing database loaded');
    } catch (error) {
      console.log('Failed to load existing database, creating new:', error.message);
      rawDb = new SQL.Database();
    }
  } else {
    console.log('Creating new database');
    rawDb = new SQL.Database();
  }
  
  db = new DatabaseWrapper(rawDb);
  
  // Run schema (uses IF NOT EXISTS so safe to run always)
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  console.log('Loading schema from:', schemaPath);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split schema into individual statements and run each
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        db.exec(stmt);
      } catch (e) {
        // Ignore errors for statements that might fail on re-run
        if (!e.message.includes('already exists')) {
          console.log('Schema statement warning:', e.message);
        }
      }
    }
  }
  console.log('Schema initialized');
  
  // Save function to persist database
  db.save = () => {
    if (process.env.NODE_ENV !== 'production') return; // Only persist in production
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const data = rawDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      console.log('Database saved to:', dbPath);
    } catch (error) {
      console.error('Failed to save database:', error.message);
    }
  };
  
  // Auto-save every 30 seconds in production
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => db.save(), 30000);
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, saving database...');
      db.save();
      process.exit(0);
    });
  }
  
  return db;
}

async function startServer() {
  await initDatabase();
  
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Trust proxy for secure cookies behind Fly.io
  app.set('trust proxy', 1);
  
  app.use(cors({ origin: true, credentials: true }));
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

  // ============= AUTH ROUTES (public) =============
  
  app.get('/api/auth/check', (req, res) => {
    if (!KATES_OFFICE_PASSWORD) {
      return res.json({ authenticated: true, authRequired: false });
    }
    res.json({ 
      authenticated: req.session?.authenticated || false,
      authRequired: true
    });
  });

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

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Failed to logout' });
      res.clearCookie('kates_office_session');
      res.json({ success: true });
    });
  });

  // Apply auth to all /api routes except /api/auth/* and /api/health
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth/') || req.path === '/health') return next();
    requireAuth(req, res, next);
  });

  // Block search engine indexing
  app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    next();
  });

  // robots.txt - block all crawlers
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /\n');
  });

  // Serve static frontend files
  const frontendPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, 'frontend_dist')
    : path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));

  // WebSocket connections for real-time updates
  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected, total:', clients.size);
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected, total:', clients.size);
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

  app.get('/api/assignments', (req, res) => {
    try {
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
      
      assignments.forEach(a => {
        a.tags = a.tags ? JSON.parse(a.tags) : [];
      });
      
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/assignments/:id', (req, res) => {
    try {
      const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
      
      assignment.tags = assignment.tags ? JSON.parse(assignment.tags) : [];
      assignment.comments = db.prepare(
        'SELECT * FROM assignment_comments WHERE assignment_id = ? ORDER BY created_at ASC'
      ).all(req.params.id);
      
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/assignments', (req, res) => {
    try {
      const id = uuidv4();
      const { title, description, status = 'inbox', priority = 'normal', due_date, tags = [] } = req.body;
      
      db.prepare(`
        INSERT INTO assignments (id, title, description, status, priority, due_date, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, title, description || '', status, priority, due_date || null, JSON.stringify(tags));
      
      const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
      assignment.tags = tags;
      
      logActivity('assignment_created', `New assignment: ${title}`, 'assignment', id);
      broadcast('assignment_created', assignment);
      db.save();
      
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/assignments/:id', (req, res) => {
    try {
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
      db.save();
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/assignments/:id', (req, res) => {
    try {
      const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
      
      db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
      
      logActivity('assignment_deleted', `Deleted: ${assignment.title}`, 'assignment', req.params.id);
      broadcast('assignment_deleted', { id: req.params.id });
      db.save();
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/assignments/:id/comments', (req, res) => {
    try {
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
      db.save();
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= EXPENSES API =============

  app.get('/api/expenses', (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/expenses/summary', (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/expenses', (req, res) => {
    try {
      const id = uuidv4();
      const { description, amount, currency = 'USD', category, date, vendor, payment_method, notes } = req.body;
      
      db.prepare(`
        INSERT INTO expenses (id, description, amount, currency, category, date, vendor, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, description, amount, currency, category || 'other', date || new Date().toISOString().split('T')[0], vendor || null, payment_method || null, notes || null);
      
      const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
      
      logActivity('expense_logged', `$${amount} - ${description}`, 'expense', id);
      broadcast('expense_created', expense);
      db.save();
      
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/expenses/:id', (req, res) => {
    try {
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
      db.save();
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/expenses/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
      broadcast('expense_deleted', { id: req.params.id });
      db.save();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= TOKEN USAGE API =============

  app.get('/api/tokens', (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/tokens/summary', (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/tokens', (req, res) => {
    try {
      const id = uuidv4();
      const { date, model, input_tokens, output_tokens, cost_usd, session_type } = req.body;
      
      db.prepare(`
        INSERT INTO token_usage (id, date, model, input_tokens, output_tokens, cost_usd, session_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, date || new Date().toISOString().split('T')[0], model, input_tokens, output_tokens, cost_usd, session_type || null);
      
      const usage = db.prepare('SELECT * FROM token_usage WHERE id = ?').get(id);
      db.save();
      res.status(201).json(usage);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= CHAT API =============

  app.get('/api/chat', (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat', (req, res) => {
    try {
      const id = uuidv4();
      const { role, content, metadata } = req.body;
      
      db.prepare(`
        INSERT INTO chat_messages (id, role, content, metadata)
        VALUES (?, ?, ?, ?)
      `).run(id, role, content, metadata ? JSON.stringify(metadata) : null);
      
      const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
      message.metadata = message.metadata ? JSON.parse(message.metadata) : null;
      
      broadcast('chat_message', message);
      db.save();
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= QAPI API =============

  app.get('/api/qapi', (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/qapi/summary', (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/qapi', (req, res) => {
    try {
      const id = req.body.id || uuidv4();
      const { title, description, severity = 'low', status = 'open' } = req.body;
      
      db.prepare(`
        INSERT INTO qapi_incidents (id, title, description, severity, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, title, description || '', severity, status);
      
      const incident = db.prepare('SELECT * FROM qapi_incidents WHERE id = ?').get(id);
      
      logActivity('qapi_incident_created', `New incident: ${title}`, 'qapi', id);
      broadcast('qapi_incident_created', incident);
      db.save();
      
      res.status(201).json(incident);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/qapi/:id', (req, res) => {
    try {
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
        setClause.push('resolved_at = COALESCE(resolved_at, datetime("now"))');
      } else if (updates.status === 'open' || updates.status === 'in_progress') {
        setClause.push('resolved_at = NULL');
      }
      
      values.push(id);
      db.prepare(`UPDATE qapi_incidents SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
      
      const incident = db.prepare('SELECT * FROM qapi_incidents WHERE id = ?').get(id);
      broadcast('qapi_incident_updated', incident);
      db.save();
      
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= ACTIVITY API =============

  app.get('/api/activity', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const activity = db.prepare(`
        SELECT * FROM activity_log 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= NOTES API =============

  app.get('/api/notes', (req, res) => {
    try {
      const notes = db.prepare('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC').all();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/notes', (req, res) => {
    try {
      const id = uuidv4();
      const { content, pinned = false } = req.body;
      
      db.prepare('INSERT INTO notes (id, content, pinned) VALUES (?, ?, ?)').run(id, content, pinned ? 1 : 0);
      
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
      db.save();
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/notes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { content, pinned } = req.body;
      
      const updates = [];
      const values = [];
      
      if (content !== undefined) {
        updates.push('content = ?');
        values.push(content);
      }
      if (pinned !== undefined) {
        updates.push('pinned = ?');
        values.push(pinned ? 1 : 0);
      }
      updates.push('updated_at = datetime("now")');
      
      values.push(id);
      db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
      db.save();
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/notes/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
      db.save();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= DAILY QUESTIONS API =============

  app.get('/api/questions', (req, res) => {
    try {
      const { status, date } = req.query;
      let query = 'SELECT * FROM daily_questions';
      const params = [];
      const conditions = [];
      
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      if (date) {
        conditions.push('date = ?');
        params.push(date);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC';
      
      const questions = db.prepare(query).all(...params);
      questions.forEach(q => {
        q.questions = q.questions ? JSON.parse(q.questions) : [];
        q.answers = q.answers ? JSON.parse(q.answers) : [];
      });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/questions/:id', (req, res) => {
    try {
      const question = db.prepare('SELECT * FROM daily_questions WHERE id = ?').get(req.params.id);
      if (!question) return res.status(404).json({ error: 'Not found' });
      
      question.questions = question.questions ? JSON.parse(question.questions) : [];
      question.answers = question.answers ? JSON.parse(question.answers) : [];
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/questions', (req, res) => {
    try {
      const id = uuidv4();
      const { date, questions } = req.body;
      const dateValue = date || new Date().toISOString().split('T')[0];
      
      db.prepare(`
        INSERT INTO daily_questions (id, date, questions, status)
        VALUES (?, ?, ?, 'pending')
      `).run(id, dateValue, JSON.stringify(questions));
      
      const record = db.prepare('SELECT * FROM daily_questions WHERE id = ?').get(id);
      record.questions = JSON.parse(record.questions);
      record.answers = [];
      
      logActivity('questions_posted', `Kate posted ${questions.length} questions for ${dateValue}`, 'questions', id);
      broadcast('questions_posted', record);
      db.save();
      
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/questions/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { answers, status } = req.body;
      
      const updates = [];
      const values = [];
      
      if (answers !== undefined) {
        updates.push('answers = ?');
        values.push(JSON.stringify(answers));
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
        if (status === 'answered') {
          updates.push('answered_at = datetime("now")');
        }
      }
      
      values.push(id);
      db.prepare(`UPDATE daily_questions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      const record = db.prepare('SELECT * FROM daily_questions WHERE id = ?').get(id);
      record.questions = record.questions ? JSON.parse(record.questions) : [];
      record.answers = record.answers ? JSON.parse(record.answers) : [];
      
      logActivity('questions_answered', `Zack answered questions for ${record.date}`, 'questions', id);
      broadcast('questions_answered', record);
      db.save();
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= CRON JOBS API =============

  app.get('/api/cron', (req, res) => {
    try {
      const jobs = db.prepare('SELECT * FROM cron_jobs ORDER BY next_run ASC').all();
      jobs.forEach(j => {
        j.schedule = j.schedule ? JSON.parse(j.schedule) : {};
      });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cron/sync', (req, res) => {
    try {
      const { jobs } = req.body;
      
      // Clear existing and insert fresh data
      db.prepare('DELETE FROM cron_jobs').run();
      
      const insert = db.prepare(`
        INSERT INTO cron_jobs (id, name, schedule, next_run, last_run, last_status, enabled, payload_summary, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      jobs.forEach(job => {
        insert.run(
          job.id,
          job.name,
          JSON.stringify(job.schedule),
          job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
          job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : null,
          job.state?.lastStatus || null,
          job.enabled ? 1 : 0,
          job.payload?.text?.substring(0, 100) || job.payload?.message?.substring(0, 100) || null
        );
      });
      
      logActivity('cron_synced', `Synced ${jobs.length} cron jobs`, 'cron', null);
      db.save();
      
      res.json({ synced: jobs.length, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= TASKS API (legacy compatibility) =============

  app.get('/api/tasks', (req, res) => {
    // Redirect to assignments
    res.redirect('/api/assignments');
  });

  // ============= WEATHER API =============

  app.get('/api/weather', async (req, res) => {
    try {
      const location = req.query.location || 'Pensacola,FL';
      const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      const data = await response.json();
      
      const current = data.current_condition?.[0];
      const forecast = data.weather?.slice(0, 3) || [];
      
      res.json({
        location: data.nearest_area?.[0]?.areaName?.[0]?.value || location,
        current: {
          temp_f: current?.temp_F,
          temp_c: current?.temp_C,
          feels_like_f: current?.FeelsLikeF,
          condition: current?.weatherDesc?.[0]?.value,
          humidity: current?.humidity,
          wind_mph: current?.windspeedMiles,
          uv: current?.uvIndex,
          icon: current?.weatherCode
        },
        forecast: forecast.map(day => ({
          date: day.date,
          max_f: day.maxtempF,
          min_f: day.mintempF,
          condition: day.hourly?.[4]?.weatherDesc?.[0]?.value,
          icon: day.hourly?.[4]?.weatherCode
        })),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= CALENDAR API =============

  const parseCalendarData = () => {
    const events = [];
    const birthdays = [];
    const trips = [];
    
    // Key dates from knowledge
    const knownBirthdays = [
      { name: 'Kamryn Miller', date: '02-16', relation: 'niece', turning: 16 },
      { name: 'Marley', date: '02-27', relation: 'great-niece', turning: 11 },
      { name: 'Andrew Miller', date: '03-02', relation: 'nephew', turning: 30 },
      { name: 'Lisa Roberts Milo', date: '03-07', relation: 'mother-in-law' },
      { name: 'Morgan Fox', date: '03-16', relation: 'niece', turning: 25 },
      { name: 'Chelsea', date: '04-04', relation: 'daughter', turning: 23 },
      { name: 'Archer', date: '04-20', relation: 'great-nephew', turning: 4 },
      { name: 'Zack', date: '06-19', relation: 'self', turning: 42 },
      { name: 'Jake', date: '06-29', relation: 'partner', turning: 35 },
      { name: 'Motley Laine Fox', date: '07-01', relation: 'great-nephew', turning: 1 },
      { name: 'Megan McMillan', date: '07-02', relation: 'niece', turning: 29 },
      { name: 'Wedding Anniversary', date: '07-11', relation: 'milestone', years: 6 },
      { name: 'Bennett', date: '08-22', relation: 'child', turning: 1 },
      { name: 'Allison Sharpe McMillan', date: '08-31', relation: 'sister' },
      { name: 'Mikalli McMillan', date: '12-31', relation: 'niece' }
    ];
    
    const now = new Date();
    const year = now.getFullYear();
    
    knownBirthdays.forEach(b => {
      const [month, day] = b.date.split('-');
      let eventDate = new Date(year, parseInt(month) - 1, parseInt(day));
      if (eventDate < now) {
        eventDate = new Date(year + 1, parseInt(month) - 1, parseInt(day));
      }
      birthdays.push({
        ...b,
        date: eventDate.toISOString().split('T')[0],
        daysUntil: Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24))
      });
    });
    
    // Sort birthdays by days until
    birthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    
    // Upcoming trips
    const upcomingTrips = [
      {
        name: 'Cruise with Chelsea',
        start: '2026-03-29',
        end: '2026-04-03',
        type: 'cruise',
        details: 'Celebrity Reflection - Chelsea\'s 23rd Birthday Trip!'
      },
      {
        name: 'Celebrity Summit Cruise + Fort Lauderdale',
        start: '2026-04-08',
        end: '2026-04-14',
        type: 'cruise',
        details: 'Zack + Jake - Celebrity Summit cruise, confirmation #H5SZIW'
      },
      {
        name: 'Lake Como, Italy',
        start: '2026-06-23',
        end: '2026-07-01',
        type: 'international',
        details: 'Bucket list trip! Jake\'s birthday (Jun 29) in Italy 🇮🇹',
        highlight: true
      }
    ];
    
    upcomingTrips.forEach(trip => {
      const startDate = new Date(trip.start);
      const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntil > -7) { // Show trips that ended within last week
        trips.push({
          ...trip,
          daysUntil,
          isActive: daysUntil <= 0 && daysUntil > -((new Date(trip.end) - new Date(trip.start)) / (1000 * 60 * 60 * 24))
        });
      }
    });
    
    // Upcoming events (next 30 days)
    const upcomingEvents = [
      { date: '2026-02-23', title: 'Dr. Berger Virtual Appointment', type: 'medical' },
      { date: '2026-02-25', title: 'Bennett\'s Pediatric NP Appointment', type: 'medical', time: '12:00 PM CT' },
      { date: '2026-03-13', title: 'Lauren Vanwinkle Visiting', type: 'social', end: '2026-03-15' },
      { date: '2026-03-16', title: 'Milan Laser Appointment', type: 'personal', time: '9:50 AM CT' },
      { date: '2026-04-23', title: 'Investment Strategy Meeting', type: 'financial', time: '12:00 PM CT' },
      { date: '2026-05-04', title: 'Anderson Advisors Check-in', type: 'financial', time: '2:00 PM CT' },
      { date: '2026-05-14', title: 'Erica Visiting', type: 'social', end: '2026-05-17' },
      { date: '2026-06-15', title: 'Jake\'s Family Visiting from Ohio', type: 'family', end: '2026-06-21' }
    ];
    
    upcomingEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 60) {
        events.push({
          ...event,
          daysUntil
        });
      }
    });
    
    events.sort((a, b) => a.daysUntil - b.daysUntil);
    
    return { events, birthdays, trips };
  };

  app.get('/api/calendar', (req, res) => {
    try {
      const data = parseCalendarData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/calendar/today', (req, res) => {
    try {
      const data = parseCalendarData();
      const today = new Date().toISOString().split('T')[0];
      
      const todayEvents = data.events.filter(e => e.date === today);
      const todayBirthdays = data.birthdays.filter(b => b.daysUntil === 0);
      
      res.json({
        date: today,
        events: todayEvents,
        birthdays: todayBirthdays,
        hasEvents: todayEvents.length > 0 || todayBirthdays.length > 0
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= BUDGETS API =============

  app.get('/api/budgets', (req, res) => {
    try {
      const budgets = db.prepare('SELECT * FROM budgets ORDER BY created_at DESC').all();
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/budgets/status', (req, res) => {
    try {
      const budgets = db.prepare('SELECT * FROM budgets').all();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      
      const results = budgets.map(budget => {
        let dateFilter = '';
        if (budget.period === 'monthly') {
          dateFilter = `AND date >= '${monthStart}'`;
        } else if (budget.period === 'yearly') {
          dateFilter = `AND date >= '${yearStart}'`;
        }
        
        let query = `SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE 1=1 ${dateFilter}`;
        if (budget.category) {
          query += ` AND category = '${budget.category}'`;
        }
        
        const result = db.prepare(query).get();
        const spent = result?.spent || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        return {
          ...budget,
          spent,
          remaining: budget.amount - spent,
          percentage: Math.round(percentage * 10) / 10,
          status: percentage >= 100 ? 'exceeded' : percentage >= budget.alert_threshold * 100 ? 'warning' : 'ok'
        };
      });
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/budgets', (req, res) => {
    try {
      const id = uuidv4();
      const { name, category, amount, period = 'monthly', alert_threshold = 0.8 } = req.body;
      
      db.prepare(`
        INSERT INTO budgets (id, name, category, amount, period, alert_threshold)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, name, category || null, amount, period, alert_threshold);
      
      const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
      logActivity('budget_created', `Budget created: ${name} - $${amount}/${period}`, 'budget', id);
      db.save();
      
      res.status(201).json(budget);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/budgets/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const fields = ['name', 'category', 'amount', 'period', 'alert_threshold'];
      const setClause = ['updated_at = datetime("now")'];
      const values = [];
      
      fields.forEach(field => {
        if (updates[field] !== undefined) {
          setClause.push(`${field} = ?`);
          values.push(updates[field]);
        }
      });
      
      values.push(id);
      db.prepare(`UPDATE budgets SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
      
      const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
      db.save();
      
      res.json(budget);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/budgets/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM budgets WHERE id = ?').run(req.params.id);
      db.save();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= EXPORT API =============

  app.get('/api/expenses/export', (req, res) => {
    try {
      const { format = 'csv', from, to } = req.query;
      
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
      query += ' ORDER BY date DESC';
      
      const expenses = db.prepare(query).all(...params);
      
      if (format === 'csv') {
        const headers = ['Date', 'Description', 'Amount', 'Currency', 'Category', 'Vendor', 'Payment Method', 'Notes'];
        const rows = expenses.map(e => [
          e.date,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          e.amount,
          e.currency,
          e.category,
          `"${(e.vendor || '').replace(/"/g, '""')}"`,
          e.payment_method || '',
          `"${(e.notes || '').replace(/"/g, '""')}"`
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        res.json(expenses);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/assignments/export', (req, res) => {
    try {
      const { format = 'csv', status } = req.query;
      
      let query = 'SELECT * FROM assignments WHERE 1=1';
      const params = [];
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';
      
      const assignments = db.prepare(query).all(...params);
      
      if (format === 'csv') {
        const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Tags', 'Created', 'Completed'];
        const rows = assignments.map(a => [
          `"${(a.title || '').replace(/"/g, '""')}"`,
          a.status,
          a.priority,
          a.due_date || '',
          `"${(a.tags || '[]')}"`,
          a.created_at,
          a.completed_at || ''
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="assignments-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        res.json(assignments);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= TRENDS API =============

  app.get('/api/expenses/trends', (req, res) => {
    try {
      const { period = 'daily', days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      let groupBy, dateFormat;
      if (period === 'weekly') {
        groupBy = "strftime('%Y-%W', date)";
        dateFormat = 'week';
      } else if (period === 'monthly') {
        groupBy = "strftime('%Y-%m', date)";
        dateFormat = 'month';
      } else {
        groupBy = 'date';
        dateFormat = 'day';
      }
      
      const trends = db.prepare(`
        SELECT 
          ${groupBy} as period,
          SUM(amount) as total,
          COUNT(*) as count,
          GROUP_CONCAT(DISTINCT category) as categories
        FROM expenses 
        WHERE date >= ?
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `).all(startDate.toISOString().split('T')[0]);
      
      // Also get category breakdown
      const byCategory = db.prepare(`
        SELECT 
          category,
          SUM(amount) as total,
          COUNT(*) as count
        FROM expenses 
        WHERE date >= ?
        GROUP BY category
        ORDER BY total DESC
      `).all(startDate.toISOString().split('T')[0]);
      
      res.json({ trends, byCategory, period: dateFormat });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/qapi/trends', (req, res) => {
    try {
      const { days = 90 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const trends = db.prepare(`
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
        FROM qapi_incidents 
        WHERE created_at >= ?
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC
      `).all(startDate.toISOString());
      
      // Average resolution time
      const resolutionStats = db.prepare(`
        SELECT 
          AVG(julianday(resolved_at) - julianday(created_at)) as avg_resolution_days
        FROM qapi_incidents 
        WHERE resolved_at IS NOT NULL AND created_at >= ?
      `).get(startDate.toISOString());
      
      res.json({ 
        trends, 
        avgResolutionDays: resolutionStats?.avg_resolution_days 
          ? Math.round(resolutionStats.avg_resolution_days * 10) / 10 
          : null 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/assignments/velocity', (req, res) => {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const velocity = db.prepare(`
        SELECT 
          strftime('%Y-%W', completed_at) as week,
          COUNT(*) as completed
        FROM assignments 
        WHERE completed_at IS NOT NULL AND completed_at >= ?
        GROUP BY strftime('%Y-%W', completed_at)
        ORDER BY week ASC
      `).all(startDate.toISOString());
      
      const created = db.prepare(`
        SELECT 
          strftime('%Y-%W', created_at) as week,
          COUNT(*) as created
        FROM assignments 
        WHERE created_at >= ?
        GROUP BY strftime('%Y-%W', created_at)
        ORDER BY week ASC
      `).all(startDate.toISOString());
      
      res.json({ velocity, created });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= BRIEFING API =============

  app.get('/api/briefing', (req, res) => {
    try {
      const calendar = parseCalendarData();
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's stats
      const inboxCount = db.prepare("SELECT COUNT(*) as count FROM assignments WHERE status = 'inbox'").get();
      const urgentCount = db.prepare("SELECT COUNT(*) as count FROM assignments WHERE priority = 'urgent' AND status NOT IN ('done', 'archived')").get();
      const dueToday = db.prepare("SELECT COUNT(*) as count FROM assignments WHERE due_date = ? AND status NOT IN ('done', 'archived')").get(today);
      const openQapi = db.prepare("SELECT COUNT(*) as count FROM qapi_incidents WHERE status IN ('open', 'investigating')").get();
      
      // Recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentActivity = db.prepare(`
        SELECT * FROM activity_log 
        WHERE created_at >= ? 
        ORDER BY created_at DESC 
        LIMIT 5
      `).all(yesterday.toISOString());
      
      // Pending questions
      const pendingQuestions = db.prepare("SELECT * FROM daily_questions WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1").get();
      if (pendingQuestions) {
        pendingQuestions.questions = JSON.parse(pendingQuestions.questions || '[]');
      }
      
      // Budget alerts
      const budgets = db.prepare('SELECT * FROM budgets').all();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const budgetAlerts = [];
      
      budgets.forEach(budget => {
        if (budget.period === 'monthly') {
          let query = `SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE date >= '${monthStart}'`;
          if (budget.category) {
            query += ` AND category = '${budget.category}'`;
          }
          const result = db.prepare(query).get();
          const percentage = budget.amount > 0 ? (result.spent / budget.amount) : 0;
          if (percentage >= budget.alert_threshold) {
            budgetAlerts.push({
              name: budget.name,
              spent: result.spent,
              budget: budget.amount,
              percentage: Math.round(percentage * 100)
            });
          }
        }
      });
      
      res.json({
        date: today,
        greeting: getGreeting(),
        summary: {
          inbox: inboxCount?.count || 0,
          urgent: urgentCount?.count || 0,
          dueToday: dueToday?.count || 0,
          openIncidents: openQapi?.count || 0
        },
        todayEvents: calendar.events.filter(e => e.daysUntil === 0),
        upcomingBirthdays: calendar.birthdays.slice(0, 3),
        nextTrip: calendar.trips[0] || null,
        recentActivity,
        pendingQuestions,
        budgetAlerts
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ============= KATE STATUS API =============

  app.get('/api/kate/status', (req, res) => {
    try {
      // Get Kate's recent activity
      const lastActivity = db.prepare(`
        SELECT * FROM activity_log 
        ORDER BY created_at DESC 
        LIMIT 1
      `).get();
      
      // Get pending work
      const pendingAssignments = db.prepare("SELECT COUNT(*) as count FROM assignments WHERE status = 'in_progress'").get();
      const recentChat = db.prepare("SELECT * FROM chat_messages WHERE role = 'user' ORDER BY created_at DESC LIMIT 1").get();
      
      // Simulate Kate's current status based on context
      const statuses = [
        { status: 'ready', message: 'Ready to help', icon: '✨' },
        { status: 'organizing', message: 'Organizing your tasks', icon: '📋' },
        { status: 'monitoring', message: 'Monitoring your schedule', icon: '👀' },
        { status: 'thinking', message: 'Processing...', icon: '🤔' }
      ];
      
      let currentStatus = statuses[0];
      if (pendingAssignments?.count > 3) {
        currentStatus = statuses[1];
      }
      
      res.json({
        ...currentStatus,
        lastActivity: lastActivity?.created_at,
        pendingWork: pendingAssignments?.count || 0,
        lastUserMessage: recentChat?.created_at
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= VOICE NOTES API =============

  app.get('/api/voice-notes', (req, res) => {
    try {
      const notes = db.prepare('SELECT * FROM voice_notes ORDER BY created_at DESC LIMIT 20').all();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/voice-notes', (req, res) => {
    try {
      const id = uuidv4();
      const { transcript, audio_url, duration_seconds, action_taken = 'none', action_id } = req.body;
      
      db.prepare(`
        INSERT INTO voice_notes (id, transcript, audio_url, duration_seconds, action_taken, action_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, transcript, audio_url || null, duration_seconds || null, action_taken, action_id || null);
      
      const note = db.prepare('SELECT * FROM voice_notes WHERE id = ?').get(id);
      logActivity('voice_note_created', `Voice note: "${transcript?.substring(0, 50)}..."`, 'voice_note', id);
      db.save();
      
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= REAL CHAT API (Bridge to Telegram) =============
  
  app.post('/api/chat/send', async (req, res) => {
    try {
      const { content, senderName } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'Message content is required' });
      }
      
      const displayName = senderName || 'Website Visitor';
      
      // Save user message
      const userMsgId = uuidv4();
      db.prepare(`
        INSERT INTO chat_messages (id, role, content, metadata)
        VALUES (?, 'user', ?, ?)
      `).run(userMsgId, content, JSON.stringify({ source: 'web', senderName: displayName }));
      
      broadcast('chat_message', { 
        id: userMsgId, 
        role: 'user', 
        content, 
        created_at: new Date().toISOString(),
        metadata: { source: 'web', senderName: displayName }
      });
      
      // Forward to Kate via Telegram
      const telegramMessage = `📬 <b>Kate's Office - Web Chat</b>\n\nFrom: ${displayName}\n\n${content}\n\n<i>Reply here and I'll see it. (Web responses coming soon!)</i>`;
      
      const telegramResult = await sendToTelegram(telegramMessage);
      
      if (telegramResult.success) {
        // Send confirmation message
        const confirmId = uuidv4();
        const confirmContent = `✅ Message forwarded to Kate via Telegram! She'll respond there, and responses will show here soon.`;
        
        db.prepare(`
          INSERT INTO chat_messages (id, role, content, metadata)
          VALUES (?, 'assistant', ?, ?)
        `).run(confirmId, confirmContent, JSON.stringify({ type: 'system_confirm', telegramMessageId: telegramResult.messageId }));
        
        broadcast('chat_message', {
          id: confirmId,
          role: 'assistant',
          content: confirmContent,
          created_at: new Date().toISOString()
        });
        
        db.save();
        
        res.json({ 
          success: true, 
          messageId: userMsgId,
          telegramSent: true,
          note: 'Message sent to Kate via Telegram!'
        });
      } else {
        // Send error message
        const errorId = uuidv4();
        const errorContent = `⚠️ Couldn't reach Telegram right now. Your message was saved and Kate will see it later.`;
        
        db.prepare(`
          INSERT INTO chat_messages (id, role, content, metadata)
          VALUES (?, 'system', ?, ?)
        `).run(errorId, errorContent, JSON.stringify({ type: 'system_error', error: telegramResult.error }));
        
        broadcast('chat_message', {
          id: errorId,
          role: 'system',
          content: errorContent,
          created_at: new Date().toISOString()
        });
        
        db.save();
        
        res.json({ 
          success: true, 
          messageId: userMsgId,
          telegramSent: false,
          error: telegramResult.error,
          note: 'Message saved but Telegram delivery failed.'
        });
      }
    } catch (error) {
      console.error('Chat send error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Endpoint for Kate (OpenClaw) to poll for pending messages
  app.get('/api/chat/pending', (req, res) => {
    try {
      const messages = [...pendingMessages];
      pendingMessages.length = 0; // Clear after retrieval
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint for Kate to post responses
  app.post('/api/chat/respond', (req, res) => {
    try {
      const { content, replyToId } = req.body;
      
      const id = uuidv4();
      db.prepare(`
        INSERT INTO chat_messages (id, role, content, metadata)
        VALUES (?, 'assistant', ?, ?)
      `).run(id, content, JSON.stringify({ replyTo: replyToId, source: 'kate' }));
      
      const message = { id, role: 'assistant', content, created_at: new Date().toISOString() };
      broadcast('chat_message', message);
      db.save();
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= HEALTH CHECK =============

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'sql.js (in-memory with persistence)',
      version: '1.0.0',
      features: {
        telegram: !!TELEGRAM_BOT_TOKEN,
        chatEnabled: true
      }
    });
  });

  // Chat status endpoint
  app.get('/api/chat/status', (req, res) => {
    res.json({
      telegramEnabled: !!TELEGRAM_BOT_TOKEN,
      chatIdConfigured: !!TELEGRAM_CHAT_ID,
      note: 'Messages sent here are forwarded to Kate via Telegram.'
    });
  });

  // Catch-all for SPA routing
  app.get('*', (req, res) => {
    const indexPath = process.env.NODE_ENV === 'production'
      ? path.join(__dirname, 'frontend_dist', 'index.html')
      : path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.json({ message: 'Kate\'s Office API', endpoints: ['/api/health', '/api/assignments', '/api/expenses', '/api/tokens', '/api/qapi', '/api/activity', '/api/notes'] });
    }
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🏠 Kate's Office server running on port ${PORT}`);
    console.log(`📬 Telegram integration: ${TELEGRAM_BOT_TOKEN ? 'ENABLED' : 'DISABLED'}`);
    console.log(`💬 Target chat ID: ${TELEGRAM_CHAT_ID}\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// NOTE: Security monitor endpoints removed - were causing crash (orphaned outside async function)
// TODO: Re-add properly inside startServer() if needed
