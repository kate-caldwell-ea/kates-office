import { create } from 'zustand'

const API_BASE = '/api'

// Helper for API calls
const api = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  },
  async post(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  },
  async put(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  },
  async delete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  },
}

const useStore = create((set, get) => ({
  // ============ UI State ============
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  
  selectedAssignment: null,
  setSelectedAssignment: (assignment) => set({ selectedAssignment: assignment }),
  
  modalOpen: false,
  setModalOpen: (open) => set({ modalOpen: open }),
  
  // ============ Assignments / Kanban ============
  assignments: [],
  assignmentsLoading: false,
  assignmentsError: null,
  
  fetchAssignments: async () => {
    set({ assignmentsLoading: true, assignmentsError: null })
    try {
      const data = await api.get('/assignments')
      set({ assignments: data, assignmentsLoading: false })
    } catch (error) {
      set({ assignmentsError: error.message, assignmentsLoading: false })
      // Fallback to mock data for development
      set({
        assignments: mockAssignments,
        assignmentsLoading: false,
        assignmentsError: null,
      })
    }
  },
  
  updateAssignmentStatus: async (id, status) => {
    const prev = get().assignments
    // Optimistic update
    set({
      assignments: prev.map((a) => (a.id === id ? { ...a, status } : a)),
    })
    try {
      await api.put(`/assignments/${id}`, { status })
    } catch {
      set({ assignments: prev }) // Rollback
    }
  },
  
  updateAssignment: async (id, updates) => {
    const prev = get().assignments
    set({
      assignments: prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })
    try {
      await api.put(`/assignments/${id}`, updates)
    } catch {
      set({ assignments: prev })
    }
  },
  
  addAssignment: async (assignment) => {
    const newAssignment = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'inbox',
      priority: 'medium',
      comments: [],
      ...assignment,
    }
    set({ assignments: [...get().assignments, newAssignment] })
    try {
      await api.post('/assignments', newAssignment)
    } catch {
      // Keep local state even if API fails
    }
  },
  
  addComment: async (assignmentId, comment) => {
    const newComment = {
      id: Date.now().toString(),
      author: 'Kate',
      createdAt: new Date().toISOString(),
      text: comment,
    }
    set({
      assignments: get().assignments.map((a) =>
        a.id === assignmentId
          ? { ...a, comments: [...(a.comments || []), newComment] }
          : a
      ),
    })
  },
  
  // ============ Expenses ============
  expenses: [],
  expensesLoading: false,
  
  fetchExpenses: async () => {
    set({ expensesLoading: true })
    try {
      const data = await api.get('/expenses')
      set({ expenses: data, expensesLoading: false })
    } catch {
      set({ expenses: mockExpenses, expensesLoading: false })
    }
  },
  
  addExpense: async (expense) => {
    const newExpense = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...expense,
    }
    set({ expenses: [...get().expenses, newExpense] })
    try {
      await api.post('/expenses', newExpense)
    } catch {
      // Keep local
    }
  },
  
  // ============ QAPI Incidents ============
  incidents: [],
  incidentsLoading: false,
  
  fetchIncidents: async () => {
    set({ incidentsLoading: true })
    try {
      const data = await api.get('/qapi/incidents')
      set({ incidents: data, incidentsLoading: false })
    } catch {
      set({ incidents: mockIncidents, incidentsLoading: false })
    }
  },
  
  // ============ Activity Feed ============
  activities: [],
  activitiesLoading: false,
  
  fetchActivities: async () => {
    set({ activitiesLoading: true })
    try {
      const data = await api.get('/activities')
      set({ activities: data, activitiesLoading: false })
    } catch {
      set({ activities: mockActivities, activitiesLoading: false })
    }
  },
  
  // ============ Chat ============
  chatMessages: [],
  chatLoading: false,
  
  fetchChat: async () => {
    set({ chatLoading: true })
    try {
      const data = await api.get('/chat')
      set({ chatMessages: data, chatLoading: false })
    } catch {
      set({ chatMessages: mockChatMessages, chatLoading: false })
    }
  },
  
  sendMessage: async (message) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    }
    set({ chatMessages: [...get().chatMessages, newMessage] })
    
    // Simulate Kate's response
    setTimeout(() => {
      const kateResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'kate',
        text: getKateResponse(message),
        timestamp: new Date().toISOString(),
      }
      set({ chatMessages: [...get().chatMessages, kateResponse] })
    }, 1000)
  },
  
  // ============ Dashboard Stats ============
  stats: null,
  statsLoading: false,
  
  fetchStats: async () => {
    set({ statsLoading: true })
    try {
      const data = await api.get('/stats')
      set({ stats: data, statsLoading: false })
    } catch {
      set({ stats: mockStats, statsLoading: false })
    }
  },
}))

// Kate's personality responses
function getKateResponse(message) {
  const responses = [
    "Got it! I'll add that to my list. 📝",
    "Consider it done! Anything else?",
    "On it! I'll keep you posted.",
    "Perfect, I've noted that down. Want me to set a reminder?",
    "Understood! I'll take care of it right away. ☕",
    "Already working on it! You'll hear from me soon.",
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

// ============ Mock Data for Development ============
const mockAssignments = [
  {
    id: '1',
    title: 'Review quarterly budget report',
    description: 'Go through the Q4 financial report and highlight any anomalies',
    status: 'inbox',
    priority: 'high',
    dueDate: '2026-02-25',
    createdAt: '2026-02-18T10:00:00Z',
    comments: [
      { id: 'c1', author: 'Kate', text: 'Received from Zack via email', createdAt: '2026-02-18T10:05:00Z' }
    ],
  },
  {
    id: '2',
    title: 'Schedule team sync meeting',
    description: 'Find a time that works for everyone next week',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-02-22',
    createdAt: '2026-02-17T14:00:00Z',
    comments: [],
  },
  {
    id: '3',
    title: 'Update QAPI documentation',
    description: 'Add new incident response procedures to the docs',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-02-28',
    createdAt: '2026-02-15T09:00:00Z',
    comments: [],
  },
  {
    id: '4',
    title: 'Waiting on vendor response',
    description: 'Follow up with CloudHost about pricing tiers',
    status: 'waiting',
    priority: 'low',
    dueDate: '2026-03-01',
    createdAt: '2026-02-10T11:00:00Z',
    comments: [
      { id: 'c2', author: 'Kate', text: 'Sent follow-up email', createdAt: '2026-02-19T15:00:00Z' }
    ],
  },
  {
    id: '5',
    title: 'SSL Certificate issue',
    description: 'Certificate renewal blocked by DNS propagation',
    status: 'blocked',
    priority: 'high',
    dueDate: '2026-02-21',
    createdAt: '2026-02-19T08:00:00Z',
    comments: [],
  },
  {
    id: '6',
    title: 'Completed expense report',
    description: 'January expenses all categorized and submitted',
    status: 'done',
    priority: 'medium',
    dueDate: '2026-02-15',
    createdAt: '2026-02-01T10:00:00Z',
    comments: [],
  },
]

const mockExpenses = [
  { id: '1', description: 'OpenAI API Credits', amount: 149.99, category: 'Software', date: '2026-02-15', status: 'approved' },
  { id: '2', description: 'Anthropic Credits', amount: 200.00, category: 'Software', date: '2026-02-14', status: 'approved' },
  { id: '3', description: 'AWS Hosting', amount: 87.50, category: 'Infrastructure', date: '2026-02-01', status: 'approved' },
  { id: '4', description: 'Notion Subscription', amount: 15.00, category: 'Software', date: '2026-02-01', status: 'approved' },
  { id: '5', description: 'Coffee supplies ☕', amount: 42.00, category: 'Office', date: '2026-02-10', status: 'pending' },
  { id: '6', description: 'Desk plant 🌿', amount: 28.00, category: 'Office', date: '2026-02-08', status: 'approved' },
]

const mockIncidents = [
  {
    id: 'INC-2026-001',
    title: 'Response delay during high traffic',
    severity: 'medium',
    status: 'investigating',
    createdAt: '2026-02-18T14:30:00Z',
    description: 'Kate experienced 30s+ response times during peak usage',
  },
  {
    id: 'INC-2026-002',
    title: 'Calendar sync missed event',
    severity: 'low',
    status: 'resolved',
    createdAt: '2026-02-15T09:00:00Z',
    resolvedAt: '2026-02-15T11:00:00Z',
    description: 'One calendar event was not synced properly',
  },
  {
    id: 'INC-2026-003',
    title: 'Email classification error',
    severity: 'low',
    status: 'resolved',
    createdAt: '2026-02-10T16:00:00Z',
    resolvedAt: '2026-02-10T17:30:00Z',
    description: 'Important email was incorrectly categorized as low priority',
  },
]

const mockActivities = [
  { id: '1', type: 'assignment', action: 'created', title: 'Review quarterly budget report', timestamp: '2026-02-20T10:30:00Z' },
  { id: '2', type: 'expense', action: 'approved', title: 'OpenAI API Credits', timestamp: '2026-02-20T09:15:00Z' },
  { id: '3', type: 'incident', action: 'opened', title: 'Response delay investigation', timestamp: '2026-02-18T14:30:00Z' },
  { id: '4', type: 'assignment', action: 'completed', title: 'January expense report', timestamp: '2026-02-15T16:00:00Z' },
  { id: '5', type: 'chat', action: 'message', title: 'Conversation with Zack', timestamp: '2026-02-15T11:00:00Z' },
]

const mockChatMessages = [
  { id: '1', sender: 'user', text: 'Hey Kate, how are things looking today?', timestamp: '2026-02-20T09:00:00Z' },
  { id: '2', sender: 'kate', text: "Good morning! ☀️ You have 3 items in your inbox and 2 tasks in progress. The budget report needs attention by Friday. Coffee's ready! ☕", timestamp: '2026-02-20T09:00:30Z' },
  { id: '3', sender: 'user', text: 'Any blocked items I should know about?', timestamp: '2026-02-20T09:01:00Z' },
  { id: '4', sender: 'kate', text: "Yes, the SSL certificate renewal is blocked - waiting on DNS propagation. I've set a reminder to check again tomorrow. Want me to escalate?", timestamp: '2026-02-20T09:01:30Z' },
]

const mockStats = {
  totalAssignments: 12,
  completedThisWeek: 5,
  pendingExpenses: 1,
  openIncidents: 1,
  uptime: '99.7%',
  tasksCompletedToday: 3,
}

export default useStore
