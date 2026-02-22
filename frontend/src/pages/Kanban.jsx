import { API_URL, WS_URL } from '../config.js';
import { useEffect, useState } from 'react'
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Tag,
  MessageSquare,
  Trash2,
  Edit3,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Archive,
  ArchiveRestore,
} from 'lucide-react'


const columns = [
  { id: 'inbox', title: 'Inbox', emoji: '📥', color: 'bg-warm-100 border-warm-200' },
  { id: 'in_progress', title: 'In Progress', emoji: '🔄', color: 'bg-sage-50 border-sage-200' },
  { id: 'waiting', title: 'Waiting', emoji: '⏳', color: 'bg-rose-gold-50 border-rose-gold-200' },
  { id: 'blocked', title: 'Blocked', emoji: '🚧', color: 'bg-red-50 border-red-200' },
  { id: 'done', title: 'Done', emoji: '✓', color: 'bg-sage-100 border-sage-300' },
]

const priorityColors = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-rose-gold-100 text-rose-gold-700 border-rose-gold-200',
  normal: 'bg-sage-100 text-sage-700 border-sage-200',
  low: 'bg-warm-100 text-warm-600 border-warm-200',
}

export default function Kanban() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [showArchived])

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_URL}/assignments?includeArchived=${showArchived}`)
      const data = await res.json()
      setAssignments(data)
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleArchive = async (assignment) => {
    try {
      const newArchived = !assignment.archived
      await fetch(`${API_URL}/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: newArchived })
      })
      fetchAssignments()
    } catch (err) {
      console.error('Failed to toggle archive:', err)
    }
  }

  const getColumnAssignments = (status) => {
    return assignments.filter(a => a.status === status)
  }

  const handleDragStart = (e, assignment) => {
    setDragging(assignment)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    if (!dragging || dragging.status === newStatus) {
      setDragging(null)
      return
    }

    // Optimistic update
    setAssignments(prev => 
      prev.map(a => a.id === dragging.id ? { ...a, status: newStatus } : a)
    )

    try {
      await fetch(`${API_URL}/assignments/${dragging.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (err) {
      console.error('Failed to update:', err)
      fetchAssignments() // Revert on error
    }
    
    setDragging(null)
  }

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return { text: 'Overdue', urgent: true }
    if (diff === 0) return { text: 'Today', urgent: true }
    if (diff === 1) return { text: 'Tomorrow', urgent: false }
    if (diff <= 3) return { text: `${diff} days`, urgent: false }
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-warm-800">Assignments</h1>
          <p className="text-warm-500 mt-1">Drag and drop to update status</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              showArchived 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-cream-100 text-warm-600 hover:bg-cream-200'
            }`}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            New Assignment
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnAssignments = getColumnAssignments(column.id)
          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-80 rounded-2xl border-2 ${column.color} ${
                dragging ? 'border-dashed' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-cream-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{column.emoji}</span>
                    <h3 className="font-semibold text-warm-700">{column.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white text-xs font-medium text-warm-500">
                      {columnAssignments.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-3 space-y-3 min-h-[400px]">
                {columnAssignments.map((assignment) => {
                  const dueInfo = formatDueDate(assignment.due_date)
                  return (
                    <div
                      key={assignment.id}
                      draggable={!assignment.archived}
                      onDragStart={(e) => !assignment.archived && handleDragStart(e, assignment)}
                      onClick={() => setSelectedAssignment(assignment)}
                      className={`kanban-card ${dragging?.id === assignment.id ? 'opacity-50' : ''} ${assignment.archived ? 'opacity-60 border-dashed' : ''}`}
                    >
                      {/* Priority Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${priorityColors[assignment.priority]}`}>
                            {assignment.priority}
                          </span>
                          {assignment.archived && (
                            <span className="badge bg-gray-100 text-gray-500 border-gray-200 flex items-center gap-1">
                              <Archive className="w-3 h-3" />
                              archived
                            </span>
                          )}
                        </div>
                        {dueInfo && (
                          <span className={`text-xs flex items-center gap-1 ${
                            dueInfo.urgent ? 'text-red-500 font-medium' : 'text-warm-400'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {dueInfo.text}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-medium text-warm-800 mb-2 line-clamp-2">
                        {assignment.title}
                      </h4>

                      {/* Description Preview */}
                      {assignment.description && (
                        <p className="text-sm text-warm-500 line-clamp-2 mb-3">
                          {assignment.description}
                        </p>
                      )}

                      {/* Tags */}
                      {assignment.tags && assignment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {assignment.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream-100 text-xs text-warm-600"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Empty State */}
                {columnAssignments.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-warm-400">
                    <p className="text-sm">No assignments</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <AssignmentModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onUpdate={fetchAssignments}
        />
      )}

      {/* New Assignment Modal */}
      {showNewModal && (
        <NewAssignmentModal
          onClose={() => setShowNewModal(false)}
          onCreated={fetchAssignments}
        />
      )}
    </div>
  )
}

function AssignmentModal({ assignment, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(assignment.title)
  const [description, setDescription] = useState(assignment.description || '')
  const [priority, setPriority] = useState(assignment.priority)
  const [dueDate, setDueDate] = useState(assignment.due_date || '')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [assignment.id])

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/assignments/${assignment.id}`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch(`${API_URL}/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, due_date: dueDate || null })
      })
      onUpdate()
      setEditing(false)
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setLoading(true)
    try {
      await fetch(`${API_URL}/assignments/${assignment.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })
      setNewComment('')
      fetchComments()
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this assignment?')) return
    try {
      await fetch(`${API_URL}/assignments/${assignment.id}`, { method: 'DELETE' })
      onUpdate()
      onClose()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <span className={`badge ${priorityColors[priority]}`}>{priority}</span>
            <span className="text-sm text-warm-400 capitalize">{assignment.status.replace('_', ' ')}</span>
            {assignment.archived && (
              <span className="badge bg-gray-100 text-gray-500 border-gray-200 flex items-center gap-1">
                <Archive className="w-3 h-3" />
                archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="p-2 rounded-lg hover:bg-cream-100 text-warm-500"
              title="Edit"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={async () => {
                try {
                  await fetch(`${API_URL}/assignments/${assignment.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ archived: !assignment.archived })
                  })
                  onUpdate()
                  onClose()
                } catch (err) {
                  console.error('Failed to toggle archive:', err)
                }
              }}
              className={`p-2 rounded-lg ${assignment.archived ? 'hover:bg-sage-50 text-sage-600' : 'hover:bg-amber-50 text-amber-600'}`}
              title={assignment.archived ? 'Restore from archive' : 'Archive'}
            >
              {assignment.archived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-cream-100 text-warm-500"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {editing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input text-lg font-semibold"
                placeholder="Title"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-24 resize-none"
                placeholder="Description"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-warm-500 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-warm-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={loading} className="btn btn-primary">
                  <Check className="w-4 h-4" /> Save
                </button>
                <button onClick={() => setEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-warm-800 mb-4">{assignment.title}</h2>
              {assignment.description && (
                <p className="text-warm-600 whitespace-pre-wrap mb-4">{assignment.description}</p>
              )}
              {assignment.due_date && (
                <div className="flex items-center gap-2 text-warm-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                </div>
              )}
              {assignment.tags && assignment.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {assignment.tags.map(tag => (
                    <span key={tag} className="badge badge-sage">
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-6 pt-6 border-t border-cream-200">
            <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({comments.length})
            </h3>
            
            {/* Comment Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="input flex-1"
              />
              <button
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
                className="btn btn-primary"
              >
                Post
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-xl bg-cream-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-warm-700 capitalize">{comment.author}</span>
                    <span className="text-xs text-warm-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-warm-600">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-warm-400 text-sm text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewAssignmentModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          due_date: dueDate || null,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      })
      onCreated()
      onClose()
    } catch (err) {
      console.error('Failed to create:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-warm-800">New Assignment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream-100 text-warm-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-warm-500 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-warm-500 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-24 resize-none"
              placeholder="Add more details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-500 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-warm-500 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-warm-500 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
              placeholder="travel, birthday, gift..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleCreate}
              disabled={loading || !title.trim()}
              className="btn btn-primary flex-1"
            >
              Create Assignment
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
