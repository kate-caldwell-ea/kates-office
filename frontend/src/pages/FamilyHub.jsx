import { useState, useEffect } from 'react'
import {
  Heart,
  Gift,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Cake,
  Clock,
  User,
  Users,
  Baby,
  PartyPopper,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  MessageSquare,
  Plus,
  History,
} from 'lucide-react'
import { API_BASE } from '../config'

// Fallback family data (used if API fails)
const fallbackFamilyData = {
  immediate: [
    {
      id: 'jake',
      name: 'Jake',
      relation: 'Partner',
      birthday: '1991-06-29',
      birthdayDisplay: 'June 29',
      photo: null,
      address: '5189 Choctaw Ave, Pensacola, FL 32507',
      notes: 'Prefers king beds with extra pillows',
      giftBudget: 'TBD',
      giftStatus: 'needed', // In Lake Como for birthday!
      giftNotes: 'Celebrating in Lake Como!',
      color: 'rose-gold',
      emoji: '💕',
    },
    {
      id: 'bennett',
      name: 'Bennett',
      relation: 'Child',
      birthday: '2025-08-22',
      birthdayDisplay: 'August 22',
      photo: null,
      address: '5189 Choctaw Ave, Pensacola, FL 32507',
      notes: 'Track pediatric appointments, developmental milestones',
      giftBudget: 'TBD',
      giftStatus: 'needed', // Turns 1!
      giftNotes: "First birthday! 🎂",
      color: 'sage',
      emoji: '👶',
    },
    {
      id: 'chelsea',
      name: 'Chelsea',
      relation: 'Daughter',
      birthday: '2003-04-04',
      birthdayDisplay: 'April 4',
      photo: null,
      address: null,
      notes: 'OMS 1 at VCOM Carolinas (Class of 2029)',
      giftBudget: 'TBD',
      giftStatus: 'needed',
      giftNotes: 'Celebrating on cruise (Mar 29-Apr 3)',
      color: 'sage',
      emoji: '🎓',
    },
  ],
  extended: [
    {
      id: 'lisa',
      name: 'Lisa Roberts Milo',
      relation: 'Mother-in-law',
      birthday: '03-07', // Year unknown
      birthdayDisplay: 'March 7',
      photo: null,
      address: 'Pensacola, FL',
      notes: 'Jake\'s mom. Loves YMCA, has a black dog, helps watch Bennett',
      giftBudget: '$60-80',
      giftStatus: 'in_progress',
      giftNotes: 'Photo book (Bennett pics) — gathering photos',
      color: 'rose-gold',
      emoji: '🏠',
    },
    {
      id: 'allison',
      name: 'Allison Sharpe McMillan',
      relation: 'Sister',
      birthday: '08-31',
      birthdayDisplay: 'August 31',
      photo: null,
      address: 'The McMillan\'s, 262 Itsa Road, Cleveland, GA 30528',
      notes: 'Lives in Cleveland, GA. Married.',
      giftBudget: '$50-100',
      giftStatus: 'needed',
      giftNotes: null,
      color: 'sage',
      emoji: '👩',
    },
    {
      id: 'morgan',
      name: 'Morgan Fox',
      relation: 'Niece',
      birthday: '2001-03-16',
      birthdayDisplay: 'March 16',
      photo: null,
      address: 'The McMillan\'s, 262 Itsa Road, Cleveland, GA 30528',
      notes: 'L&D nurse at Northeast Georgia Medical Center. Married to Austin Fox (Sept 2024)',
      giftBudget: '$50-100',
      giftStatus: 'needed',
      giftNotes: 'L&D nurse, newlywed',
      color: 'rose-gold',
      emoji: '👩‍⚕️',
    },
    {
      id: 'megan',
      name: 'Megan McMillan',
      relation: 'Niece',
      birthday: '1997-07-02',
      birthdayDisplay: 'July 2',
      photo: null,
      address: 'The McMillan\'s, 262 Itsa Road, Cleveland, GA 30528',
      notes: 'Lives in Cleveland, GA. In a relationship. Mom to Marley & Archer',
      giftBudget: '$50-100',
      giftStatus: 'needed',
      giftNotes: null,
      color: 'sage',
      emoji: '👩',
    },
    {
      id: 'mikalli',
      name: 'Mikalli McMillan',
      relation: 'Niece',
      birthday: '12-31',
      birthdayDisplay: 'December 31',
      photo: null,
      address: 'The McMillan\'s, 262 Itsa Road, Cleveland, GA 30528',
      notes: "Allison's daughter",
      giftBudget: '$50-100',
      giftStatus: 'needed',
      giftNotes: 'New Year\'s Eve birthday!',
      color: 'rose-gold',
      emoji: '🎆',
    },
    {
      id: 'andrew',
      name: 'Andrew Miller',
      relation: 'Nephew',
      birthday: '1996-03-02',
      birthdayDisplay: 'March 2',
      photo: null,
      address: 'The Miller\'s, 506 Thomson Road, Washington, GA 30673',
      notes: "Son of Zack's late sister Ashley. Lives in Statesboro, GA",
      giftBudget: '$50-100',
      giftStatus: 'skip',
      giftNotes: 'Zack decision: skip this year',
      color: 'sage',
      emoji: '👨',
    },
    {
      id: 'kamryn',
      name: 'Kamryn Miller',
      relation: 'Niece',
      birthday: '2010-02-16',
      birthdayDisplay: 'February 16',
      photo: null,
      address: 'The Miller\'s, 506 Thomson Road, Washington, GA 30673',
      notes: "Daughter of Zack's late sister Ashley. Lives in Washington, GA",
      giftBudget: '$50-100',
      giftStatus: 'done', // Past for 2026
      giftNotes: null,
      color: 'rose-gold',
      emoji: '👧',
    },
  ],
  greatNiecesNephews: [
    {
      id: 'marley',
      name: 'Marley',
      relation: 'Great-niece',
      birthday: '2015-02-27',
      birthdayDisplay: 'February 27',
      photo: null,
      address: 'The McMillan\'s, 262 Itsa Road, Cleveland, GA 30528',
      notes: "Megan's daughter",
      giftBudget: '$30-60',
      giftStatus: 'done',
      giftNotes: 'Purchased 2026-02-20',
      color: 'rose-gold',
      emoji: '🎀',
      parentId: 'megan',
    },
    {
      id: 'archer',
      name: 'Archer',
      relation: 'Great-nephew',
      birthday: '2022-04-20',
      birthdayDisplay: 'April 20',
      photo: null,
      address: 'The McMillan\'s, 262 Itsa Road, Cleveland, GA 30528',
      notes: "Megan's son. Turns 4 in 2026!",
      giftBudget: '$30-60',
      giftStatus: 'needed',
      giftNotes: 'Turns 4',
      color: 'sage',
      emoji: '🏹',
      parentId: 'megan',
    },
    {
      id: 'motley',
      name: 'Motley Laine Fox',
      relation: 'Great-nephew',
      birthday: '2025-07-01',
      birthdayDisplay: 'July 1',
      photo: null,
      address: 'The McMillan\'s, 262 Itsa Road, Cleveland, GA 30528',
      notes: "Morgan & Austin's son. Born July 1, 2025",
      giftBudget: '$30-60',
      giftStatus: 'needed',
      giftNotes: 'Turns 1!',
      color: 'rose-gold',
      emoji: '🍼',
      parentId: 'morgan',
    },
  ],
}

// Calculate days until birthday
function getDaysUntilBirthday(birthdayStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let month, day
  if (birthdayStr.includes('-') && birthdayStr.length > 5) {
    // Full date: YYYY-MM-DD
    const parts = birthdayStr.split('-')
    month = parseInt(parts[1]) - 1
    day = parseInt(parts[2])
  } else {
    // Partial date: MM-DD
    const parts = birthdayStr.split('-')
    month = parseInt(parts[0]) - 1
    day = parseInt(parts[1])
  }
  
  let nextBirthday = new Date(today.getFullYear(), month, day)
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month, day)
  }
  
  const diffTime = nextBirthday - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Calculate age from birthday
function getAge(birthdayStr) {
  if (!birthdayStr.includes('-') || birthdayStr.length <= 5) return null
  const parts = birthdayStr.split('-')
  const birthYear = parseInt(parts[0])
  if (birthYear < 1900) return null
  
  const today = new Date()
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])
  
  let age = today.getFullYear() - birthYear
  const birthdayThisYear = new Date(today.getFullYear(), month, day)
  if (today < birthdayThisYear) age--
  
  return age
}

// Gift status badge
function GiftStatusBadge({ status, notes }) {
  const configs = {
    done: { icon: CheckCircle2, label: 'Done', className: 'bg-green-100 text-green-700 border-green-200' },
    in_progress: { icon: Loader2, label: 'In Progress', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    needed: { icon: AlertCircle, label: 'Needed', className: 'bg-red-100 text-red-700 border-red-200' },
    skip: { icon: ChevronDown, label: 'Skip', className: 'bg-warm-100 text-warm-500 border-warm-200' },
  }
  
  const config = configs[status] || configs.needed
  const Icon = config.icon
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </div>
  )
}

// Birthday countdown badge
function BirthdayCountdown({ days }) {
  if (days === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-gold-400 to-rose-gold-500 text-white text-sm font-medium shadow-sm animate-pulse">
        <PartyPopper className="w-4 h-4" />
        <span>Today! 🎉</span>
      </div>
    )
  }
  
  if (days <= 7) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-gold-100 text-rose-gold-700 text-sm font-medium border border-rose-gold-200">
        <Cake className="w-4 h-4" />
        <span>{days} day{days !== 1 ? 's' : ''} away!</span>
      </div>
    )
  }
  
  if (days <= 30) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>{days} days</span>
      </div>
    )
  }
  
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-200 text-warm-600 text-xs">
      <Calendar className="w-3.5 h-3.5" />
      <span>{days} days</span>
    </div>
  )
}

// Family member card
function FamilyCard({ person, expanded, onToggle }) {
  const days = getDaysUntilBirthday(person.birthday)
  const age = getAge(person.birthday)
  const isUpcoming = days <= 30
  
  const colorClasses = {
    sage: {
      bg: 'bg-gradient-to-br from-sage-50 to-sage-100',
      border: 'border-sage-200 hover:border-sage-300',
      accent: 'bg-sage-500',
      icon: 'text-sage-600',
    },
    'rose-gold': {
      bg: 'bg-gradient-to-br from-rose-gold-50 to-rose-gold-100',
      border: 'border-rose-gold-200 hover:border-rose-gold-300',
      accent: 'bg-rose-gold-500',
      icon: 'text-rose-gold-600',
    },
  }
  
  const colors = colorClasses[person.color] || colorClasses.sage
  
  return (
    <div 
      className={`relative rounded-2xl border-2 ${colors.border} ${isUpcoming ? 'ring-2 ring-rose-gold-300 ring-offset-2' : ''} 
        overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
      onClick={onToggle}
    >
      {/* Card Content */}
      <div className={`${colors.bg} p-5`}>
        {/* Header with photo and basic info */}
        <div className="flex items-start gap-4">
          {/* Photo placeholder */}
          <div className={`w-16 h-16 rounded-2xl ${colors.accent} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
            {person.photo ? (
              <img src={person.photo} alt={person.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{person.emoji}</span>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-warm-800 text-lg leading-tight">{person.name}</h3>
                <p className="text-warm-500 text-sm">{person.relation}</p>
              </div>
              <BirthdayCountdown days={days} />
            </div>
            
            {/* Birthday */}
            <div className="flex items-center gap-2 mt-2 text-sm text-warm-600">
              <Cake className="w-4 h-4 text-rose-gold-400" />
              <span>{person.birthdayDisplay}</span>
              {age !== null && <span className="text-warm-400">• Age {age}</span>}
            </div>
          </div>
        </div>
        
        {/* Gift Status */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-sm text-warm-600">Gift Status:</span>
          </div>
          <GiftStatusBadge status={person.giftStatus} notes={person.giftNotes} />
        </div>
        
        {person.giftNotes && (
          <p className="mt-2 text-xs text-warm-500 italic pl-6">{person.giftNotes}</p>
        )}
        
        {/* Expand indicator */}
        <div className="flex justify-center mt-3">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-warm-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-warm-400" />
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="bg-white border-t border-cream-200 p-5 space-y-4 animate-fadeIn">
          {/* Address */}
          {person.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-warm-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-warm-400 uppercase tracking-wide mb-1">Shipping Address</p>
                <p className="text-sm text-warm-700">{person.address}</p>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {person.notes && (
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-warm-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-warm-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-warm-700">{person.notes}</p>
              </div>
            </div>
          )}
          
          {/* Budget */}
          {person.giftBudget && (
            <div className="flex items-center gap-3">
              <Gift className="w-4 h-4 text-warm-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-warm-400 uppercase tracking-wide mb-1">Gift Budget</p>
                <p className="text-sm text-warm-700 font-medium">{person.giftBudget}</p>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-cream-100">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-100 text-sage-700 text-sm font-medium hover:bg-sage-200 transition-colors">
              <Gift className="w-4 h-4" />
              Send Gift
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100 text-warm-600 text-sm font-medium hover:bg-cream-200 transition-colors">
              <Plus className="w-4 h-4" />
              Add Note
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100 text-warm-600 text-sm font-medium hover:bg-cream-200 transition-colors">
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Section header
function SectionHeader({ icon: Icon, title, count, color = 'sage' }) {
  const colors = {
    sage: 'from-sage-500 to-sage-600',
    'rose-gold': 'from-rose-gold-400 to-rose-gold-500',
    cream: 'from-warm-400 to-warm-500',
  }
  
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-warm-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {title}
        </h2>
        <p className="text-sm text-warm-500">{count} {count === 1 ? 'person' : 'people'}</p>
      </div>
    </div>
  )
}

// Upcoming birthdays banner
function UpcomingBirthdaysBanner({ familyData }) {
  const allPeople = [...familyData.immediate, ...familyData.extended, ...familyData.greatNiecesNephews]
  const upcoming = allPeople
    .map(p => ({ ...p, days: getDaysUntilBirthday(p.birthday) }))
    .filter(p => p.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)
  
  if (upcoming.length === 0) return null
  
  return (
    <div className="bg-gradient-to-r from-rose-gold-400 via-rose-gold-500 to-sage-500 rounded-2xl p-6 text-white shadow-lg mb-8">
      <div className="flex items-center gap-3 mb-4">
        <PartyPopper className="w-6 h-6" />
        <h2 className="text-xl font-semibold">Upcoming Birthdays</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {upcoming.map(person => (
          <div key={person.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{person.emoji}</span>
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-white/80">
                  {person.days === 0 ? 'Today! 🎉' : `In ${person.days} days`}
                </p>
              </div>
            </div>
            <p className="text-sm text-white/70 mt-2">{person.birthdayDisplay}</p>
            {person.giftStatus === 'needed' && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-xs">
                <AlertCircle className="w-3 h-3" />
                Gift needed
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Main component
export default function FamilyHub() {
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [familyData, setFamilyData] = useState(fallbackFamilyData)
  const [loading, setLoading] = useState(true)
  
  // Fetch family data from API
  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/family`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          // Merge API data with fallback structure
          if (data.immediate?.length > 0 || data.extended?.length > 0) {
            setFamilyData(data)
          }
        }
      } catch (error) {
        // Use fallback data on error
      } finally {
        setLoading(false)
      }
    }
    fetchFamilyData()
  }, [])
  
  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-gold-500" />
            Family Hub
          </h1>
          <p className="text-warm-500 mt-1">Your digital family photo wall</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-cream-100 border border-cream-200">
          <Users className="w-5 h-5 text-warm-500" />
          <span className="text-warm-600 font-medium">
            {familyData.immediate.length + familyData.extended.length + familyData.greatNiecesNephews.length} Family Members
          </span>
        </div>
      </div>
      
      {/* Upcoming Birthdays Banner */}
      <UpcomingBirthdaysBanner familyData={familyData} />
      
      {/* Immediate Family */}
      <section>
        <SectionHeader 
          icon={Heart} 
          title="Immediate Family" 
          count={familyData.immediate.length}
          color="rose-gold"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyData.immediate.map(person => (
            <FamilyCard 
              key={person.id} 
              person={person}
              expanded={expandedCards.has(person.id)}
              onToggle={() => toggleCard(person.id)}
            />
          ))}
        </div>
      </section>
      
      {/* Extended Family */}
      <section>
        <SectionHeader 
          icon={Users} 
          title="Extended Family" 
          count={familyData.extended.length}
          color="sage"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyData.extended.map(person => (
            <FamilyCard 
              key={person.id} 
              person={person}
              expanded={expandedCards.has(person.id)}
              onToggle={() => toggleCard(person.id)}
            />
          ))}
        </div>
      </section>
      
      {/* Great-Nieces & Nephews */}
      <section>
        <SectionHeader 
          icon={Baby} 
          title="Great-Nieces & Nephews" 
          count={familyData.greatNiecesNephews.length}
          color="rose-gold"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyData.greatNiecesNephews.map(person => (
            <FamilyCard 
              key={person.id} 
              person={person}
              expanded={expandedCards.has(person.id)}
              onToggle={() => toggleCard(person.id)}
            />
          ))}
        </div>
      </section>
      
      {/* Gift Summary Card */}
      <section className="card">
        <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-rose-gold-500" />
          2026 Gift Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Done</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-2">
              {[...familyData.immediate, ...familyData.extended, ...familyData.greatNiecesNephews]
                .filter(p => p.giftStatus === 'done').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <Loader2 className="w-5 h-5" />
              <span className="font-medium">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 mt-2">
              {[...familyData.immediate, ...familyData.extended, ...familyData.greatNiecesNephews]
                .filter(p => p.giftStatus === 'in_progress').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Needed</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-2">
              {[...familyData.immediate, ...familyData.extended, ...familyData.greatNiecesNephews]
                .filter(p => p.giftStatus === 'needed').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-warm-50 border border-warm-200">
            <div className="flex items-center gap-2 text-warm-600">
              <ChevronDown className="w-5 h-5" />
              <span className="font-medium">Skipped</span>
            </div>
            <p className="text-2xl font-bold text-warm-600 mt-2">
              {[...familyData.immediate, ...familyData.extended, ...familyData.greatNiecesNephews]
                .filter(p => p.giftStatus === 'skip').length}
            </p>
          </div>
        </div>
      </section>
      
      {/* Shipping Addresses Quick Reference */}
      <section className="card">
        <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sage-500" />
          Shipping Addresses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
            <p className="text-sm font-medium text-warm-700 mb-2">🏠 Home (Zack & Jake)</p>
            <p className="text-sm text-warm-600">5189 Choctaw Ave<br/>Pensacola, FL 32507</p>
          </div>
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
            <p className="text-sm font-medium text-warm-700 mb-2">🏡 The McMillan's</p>
            <p className="text-sm text-warm-600">262 Itsa Road<br/>Cleveland, GA 30528</p>
            <p className="text-xs text-warm-400 mt-2">Allison, Morgan, Megan, Mikalli, Marley, Archer, Motley</p>
          </div>
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
            <p className="text-sm font-medium text-warm-700 mb-2">🏡 The Miller's</p>
            <p className="text-sm text-warm-600">506 Thomson Road<br/>Washington, GA 30673</p>
            <p className="text-xs text-warm-400 mt-2">Andrew, Kamryn</p>
          </div>
        </div>
      </section>
    </div>
  )
}
