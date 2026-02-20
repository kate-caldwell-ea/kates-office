// Seed data for Kate's Office

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, 'kates-office.db'));

// Sample assignments
const assignments = [
  {
    id: uuidv4(),
    title: 'Book Bernina Express Excellence Class',
    description: 'June 28, 2026 - Tirano to St. Moritz, 9:17am departure, 2 passengers. rhb.ch is down, try SBB.ch or contact railway directly.',
    status: 'in_progress',
    priority: 'high',
    tags: JSON.stringify(['travel', 'lake-como-trip']),
    due_date: '2026-03-01'
  },
  {
    id: uuidv4(),
    title: 'Research Lake Como boat charters',
    description: 'Find private boat charter options for June 27. Looking for classic wooden boat, half or full day. Quote request sent to Limotender.',
    status: 'waiting',
    priority: 'normal',
    tags: JSON.stringify(['travel', 'lake-como-trip']),
    due_date: '2026-03-01'
  },
  {
    id: uuidv4(),
    title: 'Collect car transfer quotes',
    description: 'Quotes requested from Como Limo Lux and Lake Como Transfers for 4 transfers. Waiting for responses.',
    status: 'waiting',
    priority: 'normal',
    tags: JSON.stringify(['travel', 'lake-como-trip'])
  },
  {
    id: uuidv4(),
    title: 'Plan Jake\'s 35th birthday dinner',
    description: 'June 29 at Bürgenstock Resort. Research special dinner options - private dining, lakeside venue, surprise elements.',
    status: 'inbox',
    priority: 'high',
    tags: JSON.stringify(['birthday', 'lake-como-trip']),
    due_date: '2026-06-01'
  },
  {
    id: uuidv4(),
    title: 'Book Jake\'s cruise dining reservations',
    description: 'Celebrity Summit #2977019, April 9. Need specialty dining reservations.',
    status: 'inbox',
    priority: 'normal',
    tags: JSON.stringify(['travel', 'cruise'])
  },
  {
    id: uuidv4(),
    title: 'Andrew\'s birthday gift',
    description: 'March 2 - Budget $50-100. Ship to: The Miller\'s, 506 Thomson Road, Washington, GA 30673',
    status: 'inbox',
    priority: 'high',
    tags: JSON.stringify(['birthday', 'gift']),
    due_date: '2026-02-25'
  },
  {
    id: uuidv4(),
    title: 'Lisa\'s birthday gift',
    description: 'March 7 - Zack\'s mother-in-law. Research thoughtful gift ideas.',
    status: 'inbox',
    priority: 'high',
    tags: JSON.stringify(['birthday', 'gift']),
    due_date: '2026-02-28'
  }
];

// Sample expenses
const expenses = [
  {
    id: uuidv4(),
    description: 'Marley Birthday Gift - Bubble Skincare Set',
    amount: 52.82,
    category: 'gifts',
    date: '2026-02-20',
    vendor: 'Amazon',
    payment_method: 'Mercury ••3019'
  }
];

// Sample QAPI incidents
const qapi = [
  {
    id: 'INC-2026-001',
    title: 'Marley\'s gift initially not marked as gift',
    description: 'First attempt to order Marley\'s birthday gift was placed without gift options (no gift receipt, no gift message)',
    severity: 'medium',
    status: 'resolved',
    root_cause: 'Kate did not verify gift options before completing checkout',
    corrective_action: 'Created gift ordering skill with mandatory gift option checklist. All future gift orders must use amazon-gift-order skill.'
  },
  {
    id: 'INC-2026-002',
    title: 'Celebrity Cruises site blocked headless browser',
    description: 'Unable to complete dining reservations via headless browser - site returns blank pages',
    severity: 'low',
    status: 'closed',
    root_cause: 'Celebrity Cruises has anti-bot measures blocking automated browsers',
    corrective_action: 'Document site limitations. Escalate to Zack when manual intervention needed.'
  }
];

// Insert data
console.log('Seeding assignments...');
const insertAssignment = db.prepare(`
  INSERT OR REPLACE INTO assignments (id, title, description, status, priority, tags, due_date)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

assignments.forEach(a => {
  insertAssignment.run(a.id, a.title, a.description, a.status, a.priority, a.tags, a.due_date);
});

console.log('Seeding expenses...');
const insertExpense = db.prepare(`
  INSERT OR REPLACE INTO expenses (id, description, amount, category, date, vendor, payment_method)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

expenses.forEach(e => {
  insertExpense.run(e.id, e.description, e.amount, e.category, e.date, e.vendor, e.payment_method);
});

console.log('Seeding QAPI incidents...');
const insertQapi = db.prepare(`
  INSERT OR REPLACE INTO qapi_incidents (id, title, description, severity, status, root_cause, corrective_action)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

qapi.forEach(q => {
  insertQapi.run(q.id, q.title, q.description, q.severity, q.status, q.root_cause, q.corrective_action);
});

console.log('✓ Seed data inserted successfully!');
db.close();
