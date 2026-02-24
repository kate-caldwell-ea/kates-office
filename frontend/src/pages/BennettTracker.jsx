import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Baby,
  Apple,
  Plus,
  X,
  Milestone,
  Calendar,
  ThumbsUp,
  Meh,
  ThumbsDown,
  AlertTriangle,
  Trash2,
  Star,
} from 'lucide-react'

const reactionConfig = {
  loved: { emoji: '\uD83D\uDC4D', label: 'Loved it', color: 'bg-teal-500/15 text-teal-400', icon: ThumbsUp },
  okay: { emoji: '\uD83D\uDE10', label: 'Okay', color: 'bg-gold-500/15 text-gold-400', icon: Meh },
  disliked: { emoji: '\uD83E\uDD22', label: 'Disliked', color: 'bg-orange-500/15 text-orange-400', icon: ThumbsDown },
  allergic: { emoji: '\u26A0\uFE0F', label: 'Allergic/Reaction', color: 'bg-red-500/15 text-red-400', icon: AlertTriangle },
}

const foodCategories = [
  { value: 'fruit', label: 'Fruit', emoji: '\uD83C\uDF53' },
  { value: 'vegetable', label: 'Vegetable', emoji: '\uD83E\uDD66' },
  { value: 'grain', label: 'Grain', emoji: '\uD83C\uDF5E' },
  { value: 'protein', label: 'Protein', emoji: '\uD83C\uDF57' },
  { value: 'dairy', label: 'Dairy', emoji: '\uD83E\uDD5B' },
]

const milestoneCategories = [
  { value: 'motor', label: 'Motor', color: 'bg-teal-500/15 text-teal-400' },
  { value: 'language', label: 'Language', color: 'bg-blue-500/15 text-blue-400' },
  { value: 'social', label: 'Social', color: 'bg-gold-500/15 text-gold-400' },
  { value: 'cognitive', label: 'Cognitive', color: 'bg-purple-500/15 text-purple-400' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
}

// Calculate Bennett's age
function getBennettAge() {
  const birthday = new Date('2025-08-22')
  const now = new Date()
  const months = (now.getFullYear() - birthday.getFullYear()) * 12 + (now.getMonth() - birthday.getMonth())
  if (months < 1) {
    const days = Math.floor((now - birthday) / (1000 * 60 * 60 * 24))
    return `${days} days old`
  }
  return `${months} months old`
}

export default function BennettTracker() {
  const [foods, setFoods] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('foods')
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [foodsRes, milestonesRes] = await Promise.all([
        fetch(`${API_URL}/bennett/foods`),
        fetch(`${API_URL}/bennett/milestones`),
      ])
      setFoods(await foodsRes.json())
      setMilestones(await milestonesRes.json())
    } catch (err) {
      console.error('Failed to fetch Bennett data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFood = async (id) => {
    if (!confirm('Remove this food entry?')) return
    await fetch(`${API_URL}/bennett/foods/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const handleDeleteMilestone = async (id) => {
    if (!confirm('Remove this milestone?')) return
    await fetch(`${API_URL}/bennett/milestones/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  // Stats
  const totalFoods = foods.length
  const lovedFoods = foods.filter(f => f.reaction === 'loved').length
  const allergicFoods = foods.filter(f => f.reaction === 'allergic').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className="card bg-gradient-to-br from-dark-600/80 to-dark-700/80 border-teal-500/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 flex items-center justify-center">
                <Baby className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-text-200">Bennett's Tracker</h1>
                <p className="text-text-400 mt-0.5">{getBennettAge()} &middot; Food introductions & milestones</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-text-500">Foods Tried</p>
          <p className="text-2xl font-semibold text-text-200 mt-1">{totalFoods}</p>
        </div>
        <div className="card">
          <p className="text-xs text-text-500">Loved</p>
          <p className="text-2xl font-semibold text-teal-400 mt-1">{lovedFoods}</p>
        </div>
        <div className="card">
          <p className="text-xs text-text-500">Reactions</p>
          <p className="text-2xl font-semibold text-red-400 mt-1">{allergicFoods}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-2">
        <button
          onClick={() => setActiveTab('foods')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'foods'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              : 'bg-dark-600/60 text-text-400 border border-dark-300/20'
          }`}
        >
          <Apple className="w-4 h-4 inline mr-2" />
          Food Log ({foods.length})
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'milestones'
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
              : 'bg-dark-600/60 text-text-400 border border-dark-300/20'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          Milestones ({milestones.length})
        </button>
      </motion.div>

      {/* Food Log */}
      {activeTab === 'foods' && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowFoodModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Food
            </button>
          </div>

          {foods.length === 0 ? (
            <div className="card text-center py-12">
              <Apple className="w-12 h-12 text-text-600 mx-auto mb-3" />
              <h3 className="text-text-300 text-lg font-medium">No foods logged yet</h3>
              <p className="text-text-500 text-sm mt-1">Start tracking Bennett's food introductions and reactions here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {foods.map((food) => {
                const reaction = reactionConfig[food.reaction] || reactionConfig.okay
                const ReactionIcon = reaction.icon
                const cat = foodCategories.find(c => c.value === food.category)
                return (
                  <div key={food.id} className="card card-hover group">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${reaction.color}`}>
                        <ReactionIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-200">{food.food}</p>
                          {cat && <span className="text-xs text-text-500">{cat.emoji} {cat.label}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-500 mt-0.5">
                          <span>{new Date(food.date).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full ${reaction.color}`}>{reaction.label}</span>
                        </div>
                        {food.notes && <p className="text-xs text-text-400 mt-1">{food.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteFood(food.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Milestones */}
      {activeTab === 'milestones' && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowMilestoneModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>
          </div>

          {milestones.length === 0 ? (
            <div className="card text-center py-12">
              <Star className="w-12 h-12 text-text-600 mx-auto mb-3" />
              <h3 className="text-text-300 text-lg font-medium">No milestones yet</h3>
              <p className="text-text-500 text-sm mt-1">Record Bennett's developmental milestones here — first smile, first word, first steps.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {milestones.map((ms) => {
                const cat = milestoneCategories.find(c => c.value === ms.category)
                return (
                  <div key={ms.id} className="card card-hover group">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cat?.color || 'bg-dark-500 text-text-400'}`}>
                        <Star className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-200">{ms.milestone}</p>
                        <div className="flex items-center gap-3 text-xs text-text-500 mt-0.5">
                          {ms.date && <span>{new Date(ms.date).toLocaleDateString()}</span>}
                          {cat && <span className={`px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>}
                        </div>
                        {ms.notes && <p className="text-xs text-text-400 mt-1">{ms.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteMilestone(ms.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Food Modal */}
      {showFoodModal && (
        <FoodModal onClose={() => setShowFoodModal(false)} onSaved={fetchAll} />
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <MilestoneModal onClose={() => setShowMilestoneModal(false)} onSaved={fetchAll} />
      )}
    </div>
  )
}

function FoodModal({ onClose, onSaved }) {
  const [food, setFood] = useState('')
  const [category, setCategory] = useState('')
  const [reaction, setReaction] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!food.trim()) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/bennett/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food, category: category || null, reaction: reaction || null, date, notes: notes || null }),
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-dark-700 rounded-2xl shadow-xl border border-dark-300/30 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-200">Log Food Introduction</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-500/50 text-text-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-400 mb-1">Food *</label>
            <input type="text" value={food} onChange={e => setFood(e.target.value)} className="input" placeholder="e.g., Sweet potato" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                <option value="">Select...</option>
                {foodCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-400 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-400 mb-2">Reaction</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(reactionConfig).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button
                    key={key}
                    onClick={() => setReaction(key)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      reaction === key
                        ? cfg.color + ' ring-2 ring-current'
                        : 'bg-dark-600/50 text-text-400 hover:bg-dark-500/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px]">{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} placeholder="Any observations..." />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !food.trim()} className="btn btn-primary flex-1">
              {saving ? 'Saving...' : 'Log Food'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MilestoneModal({ onClose, onSaved }) {
  const [milestone, setMilestone] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!milestone.trim()) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/bennett/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone, category: category || null, date, notes: notes || null }),
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-dark-700 rounded-2xl shadow-xl border border-dark-300/30 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-200">Add Milestone</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-500/50 text-text-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-400 mb-1">Milestone *</label>
            <input type="text" value={milestone} onChange={e => setMilestone(e.target.value)} className="input" placeholder="e.g., First steps" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                <option value="">Select...</option>
                {milestoneCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-400 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} placeholder="Details..." />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !milestone.trim()} className="btn btn-primary flex-1">
              {saving ? 'Saving...' : 'Add Milestone'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
