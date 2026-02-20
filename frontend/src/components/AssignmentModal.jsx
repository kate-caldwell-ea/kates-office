import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import useStore from '../store/useStore'
import {
  X,
  Calendar,
  Flag,
  MessageSquare,
  Edit3,
  Check,
  Trash2,
  Clock,
  User,
} from 'lucide-react'

export default function AssignmentModal({ assignment, open, onClose }) {
  const { updateAssignment, addComment } = useStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (assignment) {
      setEditTitle(assignment.title || '')
      setEditDescription(assignment.description || '')
      setEditPriority(assignment.priority || 'medium')
      setEditDueDate(assignment.dueDate || '')
    }
  }, [assignment])

  if (!assignment) return null

  const handleSave = () => {
    updateAssignment(assignment.id, {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      dueDate: editDueDate || null,
    })
    setIsEditing(false)
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    addComment(assignment.id, newComment)
    setNewComment('')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const priorityOptions = [
    { value: 'high', label: 'High', color: 'text-rose-gold-600' },
    { value: 'medium', label: 'Medium', color: 'text-warm-500' },
    { value: 'low', label: 'Low', color: 'text-sage-500' },
  ]

  const statusLabels = {
    inbox: 'Inbox',
    'in-progress': 'In Progress',
    blocked: 'Blocked',
    waiting: 'Waiting',
    done: 'Done',
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-warm-900/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-cream-50">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-sage">{statusLabels[assignment.status]}</span>
                    <span className="text-sm text-warm-500">
                      Created {formatTimestamp(assignment.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-lg hover:bg-cream-200 text-warm-500 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-cream-200 text-warm-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Title Edit */}
                      <div>
                        <label className="block text-sm font-medium text-warm-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="input"
                          autoFocus
                        />
                      </div>

                      {/* Description Edit */}
                      <div>
                        <label className="block text-sm font-medium text-warm-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="input min-h-[100px] resize-none"
                          placeholder="Add a description..."
                        />
                      </div>

                      {/* Priority & Due Date */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-warm-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                            className="input"
                          >
                            {priorityOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-warm-700 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="input"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary">
                          <Check className="w-4 h-4" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Title & Description */}
                      <div>
                        <h2 className="text-xl font-semibold text-warm-800 mb-2">
                          {assignment.title}
                        </h2>
                        {assignment.description ? (
                          <p className="text-warm-600">{assignment.description}</p>
                        ) : (
                          <p className="text-warm-400 italic">No description</p>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-cream-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Flag
                            className={`w-4 h-4 ${
                              priorityOptions.find((p) => p.value === assignment.priority)?.color
                            }`}
                          />
                          <span className="text-sm text-warm-600">
                            {priorityOptions.find((p) => p.value === assignment.priority)?.label}{' '}
                            Priority
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-warm-500" />
                          <span className="text-sm text-warm-600">
                            {formatDate(assignment.dueDate)}
                          </span>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-medium text-warm-700 mb-3">
                          <MessageSquare className="w-4 h-4" />
                          Comments ({assignment.comments?.length || 0})
                        </h3>

                        {/* Comments List */}
                        <div className="space-y-3 mb-4">
                          {assignment.comments?.length > 0 ? (
                            assignment.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="p-3 bg-cream-50 rounded-xl"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-6 h-6 rounded-full bg-sage-200 flex items-center justify-center">
                                    <User className="w-3 h-3 text-sage-600" />
                                  </div>
                                  <span className="text-sm font-medium text-warm-700">
                                    {comment.author}
                                  </span>
                                  <span className="text-xs text-warm-400">
                                    {formatTimestamp(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-warm-600 ml-8">
                                  {comment.text}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-warm-400 italic py-2">
                              No comments yet
                            </p>
                          )}
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="input flex-1"
                          />
                          <button type="submit" className="btn btn-primary">
                            Add
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
