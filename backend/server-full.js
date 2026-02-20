const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const initSqlJs = require('sql.js');
const DatabaseWrapper = require('./db-wrapper');

console.log('Starting Kate\'s Office server...');
console.log('NODE_ENV:', process.env.NODE_ENV);

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

  app.use(cors());
  app.use(express.json());

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
        setClause.push('resolved_at = datetime("now")');
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

  // ============= HEALTH CHECK =============

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'sql.js (in-memory with persistence)',
      version: '1.0.0'
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
    console.log(`\n🏠 Kate's Office server running on port ${PORT}\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
