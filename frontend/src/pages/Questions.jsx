import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import {
  MessageCircle,
  Send,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
} from 'lucide-react'

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
}

const formatShortDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  })
}

export default function Questions() {
  const [questionSets, setQuestionSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedSet, setExpandedSet] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/questions`)
      const data = await res.json()
      setQuestionSets(data)
      
      // Auto-expand the latest pending set
      const pending = data.find(q => q.status === 'pending')
      if (pending) {
        setExpandedSet(pending.id)
        // Initialize answers object
        const initialAnswers = {}
        pending.questions.forEach((_, idx) => {
          initialAnswers[idx] = pending.answers?.[idx] || ''
        })
        setAnswers(initialAnswers)
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (idx, value) => {
    setAnswers(prev => ({
      ...prev,
      [idx]: value
    }))
  }

  const handleSubmit = async (setId, questions) => {
    setSubmitting(true)
    try {
      const answerArray = questions.map((_, idx) => answers[idx] || '')
      
      await fetch(`${API_URL}/questions/${setId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answerArray,
          status: 'answered'
        })
      })
      
      await fetchQuestions()
      setAnswers({})
    } catch (err) {
      console.error('Failed to submit answers:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = (setId, questions, existingAnswers) => {
    if (expandedSet === setId) {
      setExpandedSet(null)
      setAnswers({})
    } else {
      setExpandedSet(setId)
      const initialAnswers = {}
      questions.forEach((_, idx) => {
        initialAnswers[idx] = existingAnswers?.[idx] || ''
      })
      setAnswers(initialAnswers)
    }
  }

  const pendingSets = questionSets.filter(q => q.status === 'pending')
  const answeredSets = questionSets.filter(q => q.status === 'answered')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="page-title">Daily Questions</h1>
        <p className="text-text-400 mt-1">
          Kate's 3:30 PM check-ins — answer when you feel like it
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6">
        <div className="text-center">
          <p className="text-3xl font-semibold text-teal-400">{pendingSets.length}</p>
          <p className="text-xs text-text-400">Pending</p>
        </div>
        <div className="w-px bg-dark-400" />
        <div className="text-center">
          <p className="text-3xl font-semibold text-text-300">{answeredSets.length}</p>
          <p className="text-xs text-text-400">Answered</p>
        </div>
      </div>

      {/* Pending Questions */}
      {pendingSets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-400 uppercase tracking-wide">
            Waiting for your answers
          </h2>
          
          {pendingSets.map((set) => (
            <div
              key={set.id}
              className="bg-dark-700 rounded-2xl border-2 border-teal-500/20 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleExpand(set.id, set.questions, set.answers)}
                className="w-full p-4 flex items-center justify-between hover:bg-dark-600/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-text-200">{formatDate(set.date)}</p>
                    <p className="text-sm text-text-400">{set.questions.length} questions</p>
                  </div>
                </div>
                {expandedSet === set.id ? (
                  <ChevronUp className="w-5 h-5 text-text-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-500" />
                )}
              </button>
              
              {expandedSet === set.id && (
                <div className="px-4 pb-4 space-y-4">
                  {set.questions.map((question, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="block">
                        <span className="text-sm font-medium text-text-300">
                          {idx + 1}. {question}
                        </span>
                        <textarea
                          value={answers[idx] || ''}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          placeholder="Your answer..."
                          rows={3}
                          className="mt-2 w-full px-4 py-3 rounded-xl border border-dark-300/30 focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all resize-none text-text-200"
                        />
                      </label>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => handleSubmit(set.id, set.questions)}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-gold-500 text-white font-medium hover:bg-gold-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Answers
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {pendingSets.length === 0 && (
        <div className="bg-dark-500 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
          <p className="text-text-300 font-medium">All caught up!</p>
          <p className="text-text-500 text-sm mt-1">No pending questions right now</p>
        </div>
      )}

      {/* Answered History */}
      {answeredSets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-400 uppercase tracking-wide">
            Previous answers
          </h2>
          
          {answeredSets.map((set) => (
            <div
              key={set.id}
              className="bg-dark-700 rounded-2xl border border-dark-300/30 overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(set.id, set.questions, set.answers)}
                className="w-full p-4 flex items-center justify-between hover:bg-dark-600/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-dark-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-text-300">{formatShortDate(set.date)}</p>
                    <p className="text-sm text-text-500">{set.questions.length} answered</p>
                  </div>
                </div>
                {expandedSet === set.id ? (
                  <ChevronUp className="w-5 h-5 text-text-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-500" />
                )}
              </button>
              
              {expandedSet === set.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-dark-300/20 pt-4">
                  {set.questions.map((question, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-sm font-medium text-text-300">
                        {idx + 1}. {question}
                      </p>
                      <p className="text-text-200 bg-dark-600/50 rounded-lg px-3 py-2">
                        {set.answers?.[idx] || <span className="text-text-500 italic">No answer</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
