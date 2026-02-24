import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Gift,
  Plus,
  X,
  Calendar,
  DollarSign,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  ExternalLink,
  Users,
  UserPlus,
  Heart,
  Sparkles,
} from 'lucide-react'

const statusPipeline = [
  { value: 'upcoming', label: 'Upcoming', color: 'bg-dark-500 text-text-400', icon: Clock },
  { value: 'researching', label: 'Researching', color: 'bg-blue-500/15 text-blue-400', icon: Search },
  { value: 'selected', label: 'Selected', color: 'bg-gold-500/15 text-gold-400', icon: CheckCircle2 },
  { value: 'ordered', label: 'Ordered', color: 'bg-purple-500/15 text-purple-400', icon: Package },
  { value: 'shipped', label: 'Shipped', color: 'bg-teal-500/15 text-teal-400', icon: Truck },
  { value: 'delivered', label: 'Delivered', color: 'bg-teal-500/20 text-teal-300', icon: Gift },
]

function getDaysUntilBirthday(birthdayStr) {
  if (!birthdayStr) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const parts = birthdayStr.split('-')
  let month, day
  if (parts.length === 3) {
    month = parseInt(parts[1]) - 1
    day = parseInt(parts[2])
  } else if (parts.length === 2) {
    month = parseInt(parts[0]) - 1
    day = parseInt(parts[1])
  } else {
    return null
  }

  let next = new Date(now.getFullYear(), month, day)
  if (next < now) next = new Date(now.getFullYear() + 1, month, day)

  const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24))
  return diff
}

function formatBirthday(birthdayStr) {
  if (!birthdayStr) return ''
  const parts = birthdayStr.split('-')
  const month = parts.length === 3 ? parseInt(parts[1]) : parseInt(parts[0])
  const day = parts.length === 3 ? parseInt(parts[2]) : parseInt(parts[1])
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[month - 1]} ${day}`
}

function CountdownBadge({ days }) {
  if (days === null) return null
  if (days === 0) return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 ring-1 ring-red-500/30 animate-pulse">
      TODAY!
    </span>
  )
  if (days <= 7) return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400">
      {days}d away
    </span>
  )
  if (days <= 30) return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/15 text-gold-400">
      {days}d away
    </span>
  )
  if (days <= 60) return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400">
      {days}d away
    </span>
  )
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs text-text-500">
      {days}d
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.3 },
  }),
}

export default function GiftTracker() {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGift, setEditingGift] = useState(null)
  const [activeTab, setActiveTab] = useState('family')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchGifts()
  }, [])

  const fetchGifts = async () => {
    try {
      const res = await fetch(`${API_URL}/gifts?year=${new Date().getFullYear()}`)
      setGifts(await res.json())
    } catch (err) {
      console.error('Failed to fetch gifts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this gift entry?')) return
    await fetch(`${API_URL}/gifts/${id}`, { method: 'DELETE' })
    fetchGifts()
  }

  const handleStatusUpdate = async (id, newStatus) => {
    await fetch(`${API_URL}/gifts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchGifts()
  }

  // Separate family, friends, special
  const familyGifts = gifts.filter(g => g.group_type === 'family' || (!g.group_type && g.group_type !== 'friend'))
  const friendGifts = gifts.filter(g => g.group_type === 'friend')
  const specialGifts = gifts.filter(g => g.group_type === 'special')

  // Get the active set based on tab
  const getActiveGifts = () => {
    if (activeTab === 'family') return [...familyGifts, ...specialGifts]
    if (activeTab === 'friends') return friendGifts
    return gifts
  }

  let activeGifts = getActiveGifts()

  // Apply status filter
  if (statusFilter !== 'all') {
    activeGifts = activeGifts.filter(g => g.status === statusFilter)
  }

  // Sort by closest upcoming birthday
  const sortedGifts = [...activeGifts].sort((a, b) => {
    const aDays = getDaysUntilBirthday(a.birthday) ?? 999
    const bDays = getDaysUntilBirthday(b.birthday) ?? 999
    return aDays - bDays
  })

  // Group sorted gifts by recipient for display
  const byRecipient = {}
  sortedGifts.forEach(g => {
    if (!byRecipient[g.recipient]) byRecipient[g.recipient] = []
    byRecipient[g.recipient].push(g)
  })
  const sortedRecipients = Object.keys(byRecipient)

  // Stats
  const allActiveGifts = getActiveGifts()
  const totalBudget = allActiveGifts.reduce((sum, g) => sum + (g.budget_max || 0), 0)
  const totalSpent = allActiveGifts.reduce((sum, g) => sum + (g.cost || 0), 0)
  const pendingGifts = allActiveGifts.filter(g => !['delivered', 'shipped'].includes(g.status)).length
  const nextUpGift = sortedGifts.length > 0 ? sortedGifts[0] : null
  const nextDays = nextUpGift ? getDaysUntilBirthday(nextUpGift.birthday) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-200 flex items-center gap-3">
              <Gift className="w-7 h-7 text-gold-400" />
              Gift Tracker
            </h1>
            <p className="text-text-400 mt-1">Birthdays, budgets & gift pipeline — {new Date().getFullYear()}</p>
          </div>
          <button onClick={() => { setEditingGift(null); setShowModal(true); }} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Gift
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-xs text-text-500">Next Birthday</p>
          {nextUpGift ? (
            <>
              <p className="text-2xl font-bold text-gold-400 mt-1">
                {nextDays === 0 ? 'TODAY' : `${nextDays}d`}
              </p>
              <p className="text-xs text-text-400 mt-0.5 truncate">
                {nextUpGift.recipient} &middot; {formatBirthday(nextUpGift.birthday)}
              </p>
            </>
          ) : (
            <p className="text-2xl font-semibold text-text-500 mt-1">&mdash;</p>
          )}
        </div>
        <div className="card">
          <p className="text-xs text-text-500">Pending</p>
          <p className="text-2xl font-semibold text-text-200 mt-1">{pendingGifts}</p>
          <p className="text-xs text-text-500 mt-0.5">Need attention</p>
        </div>
        <div className="card">
          <p className="text-xs text-text-500">Spent</p>
          <p className="text-2xl font-semibold text-teal-400 mt-1">${totalSpent.toFixed(0)}</p>
          <p className="text-xs text-text-500 mt-0.5">of ${totalBudget.toFixed(0)} budget</p>
        </div>
        <div className="card">
          <p className="text-xs text-text-500">Recipients</p>
          <p className="text-2xl font-semibold text-text-200 mt-1">{sortedRecipients.length}</p>
          <p className="text-xs text-text-500 mt-0.5">{familyGifts.length + specialGifts.length} family &middot; {friendGifts.length} friends</p>
        </div>
      </motion.div>

      {/* Family / Friends Tabs */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-2">
        <button
          onClick={() => { setActiveTab('family'); setStatusFilter('all'); }}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'family'
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
              : 'bg-dark-600/60 text-text-400 border border-dark-300/20 hover:bg-dark-500/60'
          }`}
        >
          <Heart className="w-4 h-4" />
          Family ({familyGifts.length + specialGifts.length})
        </button>
        <button
          onClick={() => { setActiveTab('friends'); setStatusFilter('all'); }}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'friends'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              : 'bg-dark-600/60 text-text-400 border border-dark-300/20 hover:bg-dark-500/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Friends ({friendGifts.length})
        </button>
      </motion.div>

      {/* Status Filter Pills */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            statusFilter === 'all'
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
              : 'bg-dark-600/60 text-text-400 border border-dark-300/20 hover:bg-dark-500/60'
          }`}
        >
          All ({allActiveGifts.length})
        </button>
        {statusPipeline.map(s => {
          const count = allActiveGifts.filter(g => g.status === s.value).length
          if (count === 0 && s.value !== 'upcoming') return null
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === s.value
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                  : 'bg-dark-600/60 text-text-400 border border-dark-300/20 hover:bg-dark-500/60'
              }`}
            >
              {s.label} ({count})
            </button>
          )
        })}
      </motion.div>

      {/* Gift Cards — sorted by closest birthday */}
      {sortedRecipients.length === 0 ? (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="card text-center py-12">
          {activeTab === 'friends' ? (
            <>
              <UserPlus className="w-12 h-12 text-text-600 mx-auto mb-3" />
              <h3 className="text-text-300 text-lg font-medium">No friends tracked yet</h3>
              <p className="text-text-500 text-sm mt-1">Add friends' birthdays and start tracking gift ideas.</p>
            </>
          ) : (
            <>
              <Gift className="w-12 h-12 text-text-600 mx-auto mb-3" />
              <h3 className="text-text-300 text-lg font-medium">No gifts match this filter</h3>
              <p className="text-text-500 text-sm mt-1">Try changing the status filter or adding new gift entries.</p>
            </>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {sortedRecipients.map((recipient, ri) => {
            const recipientGifts = byRecipient[recipient]
            const firstGift = recipientGifts[0]
            const bday = firstGift.birthday
            const daysUntil = getDaysUntilBirthday(bday)
            const budgetRange = firstGift.budget_min && firstGift.budget_max
              ? `$${firstGift.budget_min}-${firstGift.budget_max}`
              : firstGift.budget_max
                ? `$${firstGift.budget_max}`
                : null

            return (
              <motion.div key={recipient} custom={4 + ri} variants={fadeUp} initial="hidden" animate="visible"
                className={`card ${daysUntil !== null && daysUntil <= 14 ? 'ring-1 ring-gold-500/20' : ''}`}
              >
                {/* Recipient Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold text-text-200">{recipient}</h2>
                    {bday && (
                      <span className="text-xs text-text-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatBirthday(bday)}
                      </span>
                    )}
                    <CountdownBadge days={daysUntil} />
                  </div>
                  <div className="flex items-center gap-2">
                    {budgetRange && (
                      <span className="text-xs text-text-500 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {budgetRange}
                      </span>
                    )}
                    {firstGift.notes && (
                      <span className="text-xs text-text-500 hidden sm:inline">{firstGift.notes}</span>
                    )}
                  </div>
                </div>

                {/* Gift entries for this recipient */}
                <div className="space-y-2">
                  {recipientGifts.map(gift => (
                    <GiftRow
                      key={gift.id}
                      gift={gift}
                      onEdit={() => { setEditingGift(gift); setShowModal(true); }}
                      onDelete={() => handleDelete(gift.id)}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <GiftModal
          gift={editingGift}
          onClose={() => { setShowModal(false); setEditingGift(null); }}
          onSaved={fetchGifts}
        />
      )}
    </div>
  )
}

function GiftRow({ gift, onEdit, onDelete, onStatusUpdate }) {
  const statusInfo = statusPipeline.find(s => s.value === gift.status) || statusPipeline[0]
  const StatusIcon = statusInfo.icon

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-600/50 hover:bg-dark-500/50 transition-colors group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
        <StatusIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-text-200 truncate">{gift.gift_idea || 'No gift idea yet'}</p>
          <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-500 mt-0.5">
          {gift.cost ? (
            <span className="text-teal-400 font-medium">${gift.cost.toFixed(0)} spent</span>
          ) : gift.budget_max ? (
            <span>Budget: ${gift.budget_min || 0}-${gift.budget_max}</span>
          ) : null}
          {gift.purchase_url && (
            <a href={gift.purchase_url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline flex items-center gap-1">
              Link <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Quick status advance */}
      {gift.status !== 'delivered' && (
        <button
          onClick={() => {
            const idx = statusPipeline.findIndex(s => s.value === gift.status)
            if (idx < statusPipeline.length - 1) {
              onStatusUpdate(gift.id, statusPipeline[idx + 1].value)
            }
          }}
          className="hidden sm:block px-3 py-1.5 rounded-lg bg-dark-500/50 text-text-400 text-xs hover:bg-dark-400/50 hover:text-text-300 transition-colors"
          title={`Advance to ${statusPipeline[statusPipeline.findIndex(s => s.value === gift.status) + 1]?.label}`}
        >
          Next &rarr;
        </button>
      )}

      <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-dark-400/50 text-text-400">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function GiftModal({ gift, onClose, onSaved }) {
  const [recipient, setRecipient] = useState(gift?.recipient || '')
  const [birthday, setBirthday] = useState(gift?.birthday || '')
  const [giftIdea, setGiftIdea] = useState(gift?.gift_idea || '')
  const [status, setStatus] = useState(gift?.status || 'upcoming')
  const [budgetMin, setBudgetMin] = useState(gift?.budget_min?.toString() || '')
  const [budgetMax, setBudgetMax] = useState(gift?.budget_max?.toString() || '')
  const [cost, setCost] = useState(gift?.cost?.toString() || '')
  const [purchaseUrl, setPurchaseUrl] = useState(gift?.purchase_url || '')
  const [notes, setNotes] = useState(gift?.notes || '')
  const [groupType, setGroupType] = useState(gift?.group_type || 'family')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!recipient.trim()) return
    setSaving(true)
    try {
      const method = gift ? 'PATCH' : 'POST'
      const url = gift ? `${API_URL}/gifts/${gift.id}` : `${API_URL}/gifts`

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          birthday: birthday || null,
          gift_idea: giftIdea || null,
          status,
          budget_min: budgetMin ? parseFloat(budgetMin) : null,
          budget_max: budgetMax ? parseFloat(budgetMax) : null,
          cost: cost ? parseFloat(cost) : null,
          purchase_url: purchaseUrl || null,
          notes: notes || null,
          group_type: groupType,
          year: new Date().getFullYear(),
        }),
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
      <div className="bg-dark-700 rounded-2xl shadow-xl border border-dark-300/30 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-200">{gift ? 'Edit Gift' : 'Add Gift'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-500/50 text-text-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Group type toggle */}
          <div className="flex gap-2">
            {[
              { value: 'family', label: 'Family', icon: Heart },
              { value: 'friend', label: 'Friend', icon: Users },
              { value: 'special', label: 'Special', icon: Sparkles },
            ].map(g => (
              <button
                key={g.value}
                onClick={() => setGroupType(g.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  groupType === g.value
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                    : 'bg-dark-600/50 text-text-400 border border-dark-300/20'
                }`}
              >
                <g.icon className="w-3.5 h-3.5" />
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-400 mb-1">Recipient *</label>
              <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className="input" placeholder="Name" autoFocus />
            </div>
            <div>
              <label className="block text-sm text-text-400 mb-1">Birthday (MM-DD)</label>
              <input type="text" value={birthday} onChange={e => setBirthday(e.target.value)} className="input" placeholder="03-16" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-400 mb-1">Gift Idea</label>
            <input type="text" value={giftIdea} onChange={e => setGiftIdea(e.target.value)} className="input" placeholder="What to get..." />
          </div>

          <div>
            <label className="block text-sm text-text-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input">
              {statusPipeline.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-400 mb-1">Budget Min</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-500">$</span>
                <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="input pl-7" placeholder="25" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-400 mb-1">Budget Max</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-500">$</span>
                <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="input pl-7" placeholder="50" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-400 mb-1">Actual Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-500">$</span>
                <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="input pl-7" placeholder="0" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-400 mb-1">Purchase URL</label>
            <input type="url" value={purchaseUrl} onChange={e => setPurchaseUrl(e.target.value)} className="input" placeholder="https://..." />
          </div>

          <div>
            <label className="block text-sm text-text-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} placeholder="Size, color preferences, etc." />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !recipient.trim()} className="btn btn-primary flex-1">
              {saving ? 'Saving...' : gift ? 'Save Changes' : 'Add Gift'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
