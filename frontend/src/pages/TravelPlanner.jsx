import { useState, useEffect } from 'react'
import {
  Plane,
  Ship,
  Calendar,
  MapPin,
  Clock,
  Hotel,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  Luggage,
  Sparkles,
  Sun,
  Palmtree,
  Mountain,
  X,
  Edit3,
  Trash2,
} from 'lucide-react'

// Luxury destination images (Unsplash)
const destinationImages = {
  'cruise': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=80',
  'fort-lauderdale': 'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=80',
  'lake-como': 'https://images.unsplash.com/photo-1537859673408-98afef2cf8dc?w=800&q=80',
  'italy': 'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=800&q=80',
  'caribbean': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
}

// Seeded trip data from the reference file
const initialTrips = [
  {
    id: 1,
    name: "Chelsea's Birthday Cruise",
    type: 'cruise',
    destination: 'Caribbean',
    ship: 'Celebrity Reflection',
    startDate: '2026-03-29',
    endDate: '2026-04-03',
    sailDate: '2026-03-30',
    travelers: ['Zack', 'Jake', 'Chelsea'],
    occasion: "Chelsea's 23rd Birthday! 🎂",
    image: destinationImages.caribbean,
    confirmations: {
      cruise: '8979513',
      flight: 'GDDTR9',
    },
    flights: [
      { date: 'Mar 29', route: 'PNS → ATL', flight: 'DL 1013', type: 'outbound' },
      { date: 'Mar 29', route: 'ATL → FLL', flight: 'DL 502', type: 'outbound' },
      { date: 'Apr 3', route: 'FLL → ATL', flight: 'DL 1563', type: 'return' },
      { date: 'Apr 3', route: 'ATL → PNS', flight: 'DL 3021', type: 'return' },
    ],
    hotels: [
      { name: 'Hilton Garden Inn Ft. Lauderdale Airport-Cruise Port', dates: 'Mar 29-30', nights: 1 },
    ],
    packingList: [
      { id: 1, item: 'Formal attire (2 nights)', checked: false, category: 'Clothing' },
      { id: 2, item: 'Swimsuits (4)', checked: false, category: 'Clothing' },
      { id: 3, item: 'Sunscreen SPF 50+', checked: false, category: 'Toiletries' },
      { id: 4, item: 'Medications', checked: false, category: 'Health' },
      { id: 5, item: 'Passports', checked: false, category: 'Documents' },
      { id: 6, item: 'Cruise documents', checked: false, category: 'Documents' },
      { id: 7, item: 'Sea bands for motion sickness', checked: false, category: 'Health' },
      { id: 8, item: 'Evening bags/clutch', checked: false, category: 'Accessories' },
    ],
    tasks: [
      { id: 1, task: 'Research Celebrity Reflection itinerary/ports', done: false },
      { id: 2, task: 'Plan birthday celebration onboard — cake? Special dinner?', done: false },
      { id: 3, task: "Chelsea's birthday gift (turning 23!)", done: false },
      { id: 4, task: 'Confirm travel insurance', done: false },
      { id: 5, task: 'Pre-book specialty restaurants', done: false },
    ],
    status: 'upcoming',
  },
  {
    id: 2,
    name: 'Celebrity Summit Cruise + Fort Lauderdale',
    type: 'cruise',
    destination: 'Caribbean',
    ship: 'Celebrity Summit',
    startDate: '2026-04-08',
    endDate: '2026-04-14',
    sailDate: '2026-04-09',
    travelers: ['Zack', 'Jake'],
    occasion: 'Spring getaway ☀️',
    image: destinationImages['fort-lauderdale'],
    confirmations: {
      cruise: '2977019',
      flight: 'H5SZIW',
    },
    flights: [
      { date: 'Apr 8', route: 'PNS → ATL', flight: 'DL 3198', type: 'outbound' },
      { date: 'Apr 8', route: 'ATL → FLL', flight: 'DL 1292', type: 'outbound' },
      { date: 'Apr 14', route: 'FLL → ATL', flight: 'DL 1094', type: 'return' },
      { date: 'Apr 14', route: 'ATL → PNS', flight: 'DL 1013', type: 'return' },
    ],
    hotels: [
      { name: 'Bahia Mar Fort Lauderdale Beach', dates: 'Apr 8', nights: 1, note: 'Pre-cruise' },
      { name: 'Bahia Mar Fort Lauderdale Beach', dates: 'Apr 14-16', nights: 2, note: 'Beach time!' },
    ],
    packingList: [
      { id: 1, item: 'Formal attire (2 nights)', checked: false, category: 'Clothing' },
      { id: 2, item: 'Swimsuits (4)', checked: false, category: 'Clothing' },
      { id: 3, item: 'Sunscreen SPF 50+', checked: false, category: 'Toiletries' },
      { id: 4, item: 'Beach cover-ups', checked: false, category: 'Clothing' },
      { id: 5, item: 'Passports', checked: false, category: 'Documents' },
      { id: 6, item: 'Cruise documents', checked: false, category: 'Documents' },
      { id: 7, item: 'Resort casual outfits', checked: false, category: 'Clothing' },
    ],
    tasks: [
      { id: 1, task: 'Research Celebrity Summit itinerary/ports', done: false },
      { id: 2, task: 'Dinner reservations post-cruise in Ft. Lauderdale', done: false },
      { id: 3, task: 'Plan beach/activities for Apr 14-16', done: false },
      { id: 4, task: 'Book spa treatments', done: false },
    ],
    status: 'upcoming',
  },
  {
    id: 3,
    name: "Lake Como — Jake's Birthday",
    type: 'international',
    destination: 'Lake Como, Italy',
    startDate: '2026-06-23',
    endDate: '2026-07-01',
    travelers: ['Zack', 'Jake'],
    occasion: "Jake's 35th Birthday! 🎂🇮🇹",
    image: destinationImages['lake-como'],
    confirmations: {
      flight: 'GZ4T38',
    },
    flights: [
      { date: 'Jun 23', route: 'PNS → ATL', flight: 'DL 1640', type: 'outbound' },
      { date: 'Jun 23', route: 'ATL → Milan MXP', flight: 'DL 174', type: 'outbound' },
      { date: 'Jul 1', route: 'Zurich ZRH → ATL', flight: 'DL 91', type: 'return' },
      { date: 'Jul 1', route: 'ATL → PNS', flight: 'DL 2211', type: 'return' },
    ],
    hotels: [],
    packingList: [
      { id: 1, item: 'Light linen shirts/pants', checked: false, category: 'Clothing' },
      { id: 2, item: 'Comfortable walking shoes', checked: false, category: 'Clothing' },
      { id: 3, item: 'Sunglasses', checked: false, category: 'Accessories' },
      { id: 4, item: 'Passports (valid 6+ months)', checked: false, category: 'Documents' },
      { id: 5, item: 'EU adapter plugs', checked: false, category: 'Electronics' },
      { id: 6, item: 'Light jacket for evenings', checked: false, category: 'Clothing' },
      { id: 7, item: 'Camera', checked: false, category: 'Electronics' },
      { id: 8, item: 'Travel wallet/money belt', checked: false, category: 'Accessories' },
    ],
    tasks: [
      { id: 1, task: 'Book hotels (outdoor seating overlooking water!)', done: false },
      { id: 2, task: 'Research best lakeside restaurants', done: false },
      { id: 3, task: 'Plan day trip to Switzerland (explains ZRH return)', done: false },
      { id: 4, task: 'Book private boat tour', done: false },
      { id: 5, task: 'Villa visits — Villa del Balbianello?', done: false },
      { id: 6, task: 'Transportation — trains, car rental, water taxi?', done: false },
      { id: 7, task: 'Notify bank of international travel', done: false },
      { id: 8, task: 'Confirm travel insurance', done: false },
      { id: 9, task: "Special birthday dinner reservation (Jake turns 35 on Jun 29!)", done: false },
    ],
    status: 'upcoming',
  },
]

// Calculate days until trip
const getDaysUntil = (dateStr) => {
  const tripDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  tripDate.setHours(0, 0, 0, 0)
  const diff = Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24))
  return diff
}

// Format date range
const formatDateRange = (start, end) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const options = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', options)} — ${endDate.toLocaleDateString('en-US', options)}`
}

// Trip Card Component
function TripCard({ trip, onUpdate, isExpanded, onToggleExpand }) {
  const daysUntil = getDaysUntil(trip.startDate)
  const isPast = daysUntil < 0
  const isImminent = daysUntil <= 14 && daysUntil >= 0
  
  const togglePackingItem = (itemId) => {
    const updatedPacking = trip.packingList.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )
    onUpdate({ ...trip, packingList: updatedPacking })
  }
  
  const toggleTask = (taskId) => {
    const updatedTasks = trip.tasks.map(task =>
      task.id === taskId ? { ...task, done: !task.done } : task
    )
    onUpdate({ ...trip, tasks: updatedTasks })
  }
  
  const packedCount = trip.packingList.filter(i => i.checked).length
  const tasksComplete = trip.tasks.filter(t => t.done).length
  
  const TripIcon = trip.type === 'cruise' ? Ship : Plane

  return (
    <div className={`card overflow-hidden ${isPast ? 'opacity-75' : ''}`}>
      {/* Hero Image */}
      <div className="relative -mx-6 -mt-6 h-48 md:h-56 overflow-hidden">
        <img 
          src={trip.image} 
          alt={trip.destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Countdown Badge */}
        <div className="absolute top-4 right-4">
          {isPast ? (
            <div className="px-3 py-1.5 rounded-full bg-warm-500 text-white text-sm font-medium">
              Completed
            </div>
          ) : isImminent ? (
            <div className="px-4 py-2 rounded-xl bg-rose-gold-500 text-white font-semibold shadow-lg animate-pulse">
              {daysUntil === 0 ? "TODAY! ✈️" : `${daysUntil} days away!`}
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-warm-700 text-sm font-medium">
              {daysUntil} days
            </div>
          )}
        </div>
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <div className="p-2 rounded-xl bg-white/90 backdrop-blur shadow-sm">
            <TripIcon className="w-5 h-5 text-sage-600" />
          </div>
        </div>
        
        {/* Title Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {trip.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{trip.destination}</span>
            {trip.ship && (
              <>
                <span className="mx-1">•</span>
                <Ship className="w-4 h-4" />
                <span>{trip.ship}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Info Bar */}
      <div className="flex items-center justify-between py-4 border-b border-cream-200">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-warm-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-warm-500">
            <span>{trip.travelers.join(', ')}</span>
          </div>
        </div>
        {trip.occasion && (
          <span className="text-sm text-rose-gold-600 font-medium">{trip.occasion}</span>
        )}
      </div>
      
      {/* Progress Bars */}
      <div className="grid grid-cols-2 gap-4 py-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-warm-500">Packing</span>
            <span className="font-medium text-warm-700">{packedCount}/{trip.packingList.length}</span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sage-500 rounded-full transition-all duration-300"
              style={{ width: `${(packedCount / trip.packingList.length) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-warm-500">Prep Tasks</span>
            <span className="font-medium text-warm-700">{tasksComplete}/{trip.tasks.length}</span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-gold-500 rounded-full transition-all duration-300"
              style={{ width: `${(tasksComplete / trip.tasks.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Expand/Collapse Button */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-sage-600 hover:text-sage-700 font-medium transition-colors"
      >
        {isExpanded ? (
          <>
            <span>Show less</span>
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            <span>Show details</span>
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="pt-4 border-t border-cream-200 space-y-6">
          {/* Confirmation Numbers */}
          <div className="bg-cream-50 rounded-xl p-4">
            <h4 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Confirmation Numbers
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {trip.confirmations.cruise && (
                <div className="bg-white rounded-lg p-3 border border-cream-200">
                  <p className="text-xs text-warm-500 uppercase tracking-wide">Cruise</p>
                  <p className="font-mono font-semibold text-warm-800">{trip.confirmations.cruise}</p>
                </div>
              )}
              {trip.confirmations.flight && (
                <div className="bg-white rounded-lg p-3 border border-cream-200">
                  <p className="text-xs text-warm-500 uppercase tracking-wide">Delta</p>
                  <p className="font-mono font-semibold text-warm-800">{trip.confirmations.flight}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Flights Timeline */}
          <div>
            <h4 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Flights
            </h4>
            <div className="space-y-2">
              {trip.flights.map((flight, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    flight.type === 'outbound' ? 'bg-sage-50' : 'bg-rose-gold-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${
                    flight.type === 'outbound' ? 'bg-sage-100' : 'bg-rose-gold-100'
                  }`}>
                    <Plane className={`w-4 h-4 ${
                      flight.type === 'outbound' ? 'text-sage-600' : 'text-rose-gold-600 rotate-180'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-warm-800">{flight.route}</p>
                    <p className="text-sm text-warm-500">{flight.date}</p>
                  </div>
                  <span className="font-mono text-sm text-warm-600">{flight.flight}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hotels */}
          {trip.hotels.length > 0 && (
            <div>
              <h4 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Accommodations
              </h4>
              <div className="space-y-2">
                {trip.hotels.map((hotel, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-cream-50 border border-cream-200">
                    <p className="font-medium text-warm-800">{hotel.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-warm-500">
                      <span>{hotel.dates}</span>
                      <span>•</span>
                      <span>{hotel.nights} night{hotel.nights > 1 ? 's' : ''}</span>
                      {hotel.note && (
                        <>
                          <span>•</span>
                          <span className="text-rose-gold-600">{hotel.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Packing Checklist */}
          <div>
            <h4 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
              <Luggage className="w-4 h-4" />
              Packing Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {trip.packingList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => togglePackingItem(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    item.checked 
                      ? 'bg-sage-50 text-warm-500 line-through' 
                      : 'bg-cream-50 text-warm-800 hover:bg-cream-100'
                  }`}
                >
                  {item.checked ? (
                    <CheckCircle2 className="w-5 h-5 text-sage-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-warm-400 flex-shrink-0" />
                  )}
                  <span className="flex-1">{item.item}</span>
                  <span className="text-xs text-warm-400">{item.category}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Prep Tasks */}
          <div>
            <h4 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Prep Tasks
            </h4>
            <div className="space-y-2">
              {trip.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    task.done 
                      ? 'bg-sage-50' 
                      : 'bg-rose-gold-50 hover:bg-rose-gold-100'
                  }`}
                >
                  {task.done ? (
                    <CheckCircle2 className="w-5 h-5 text-sage-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-rose-gold-400 flex-shrink-0" />
                  )}
                  <span className={`flex-1 ${task.done ? 'text-warm-500 line-through' : 'text-warm-800'}`}>
                    {task.task}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add Trip Modal
function AddTripModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'flight',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: '',
    occasion: '',
  })
  
  if (!isOpen) return null
  
  const handleSubmit = (e) => {
    e.preventDefault()
    const newTrip = {
      id: Date.now(),
      ...formData,
      travelers: formData.travelers.split(',').map(t => t.trim()),
      image: destinationImages.italy, // Default image
      confirmations: {},
      flights: [],
      hotels: [],
      packingList: [
        { id: 1, item: 'Passport', checked: false, category: 'Documents' },
        { id: 2, item: 'Phone charger', checked: false, category: 'Electronics' },
        { id: 3, item: 'Toiletries', checked: false, category: 'Toiletries' },
      ],
      tasks: [
        { id: 1, task: 'Confirm reservations', done: false },
        { id: 2, task: 'Notify bank of travel', done: false },
      ],
      status: 'upcoming',
    }
    onAdd(newTrip)
    onClose()
    setFormData({ name: '', type: 'flight', destination: '', startDate: '', endDate: '', travelers: '', occasion: '' })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-cream-200">
          <h2 className="text-xl font-semibold text-warm-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Plan New Adventure
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream-100 text-warm-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Trip Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              placeholder="Summer in Positano..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
            >
              <option value="flight">✈️ Flight</option>
              <option value="cruise">🚢 Cruise</option>
              <option value="road-trip">🚗 Road Trip</option>
              <option value="international">🌍 International</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Destination</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              placeholder="Amalfi Coast, Italy"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Travelers</label>
            <input
              type="text"
              value={formData.travelers}
              onChange={(e) => setFormData({...formData, travelers: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              placeholder="Zack, Jake"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Special Occasion (optional)</label>
            <input
              type="text"
              value={formData.occasion}
              onChange={(e) => setFormData({...formData, occasion: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              placeholder="Anniversary celebration 💕"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full btn btn-primary"
            >
              <Plane className="w-4 h-4" />
              Add Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TravelPlanner() {
  const [trips, setTrips] = useState(initialTrips)
  const [expandedTrip, setExpandedTrip] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('upcoming') // 'upcoming', 'past', 'all'
  
  const handleUpdateTrip = (updatedTrip) => {
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t))
  }
  
  const handleAddTrip = (newTrip) => {
    setTrips([...trips, newTrip])
  }
  
  // Sort and filter trips
  const sortedTrips = [...trips].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  const upcomingTrips = sortedTrips.filter(t => getDaysUntil(t.startDate) >= 0)
  const pastTrips = sortedTrips.filter(t => getDaysUntil(t.startDate) < 0).reverse()
  
  const displayTrips = filter === 'upcoming' ? upcomingTrips : 
                       filter === 'past' ? pastTrips : 
                       sortedTrips
  
  // Next trip countdown for header
  const nextTrip = upcomingTrips[0]
  const daysUntilNext = nextTrip ? getDaysUntil(nextTrip.startDate) : null

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-sage-600 to-sage-500 rounded-2xl p-6 md:p-8 text-white shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <Plane className="w-full h-full" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Plane className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Travel Planner
            </h1>
          </div>
          
          <p className="text-sage-100 text-lg">
            {upcomingTrips.length} upcoming adventure{upcomingTrips.length !== 1 ? 's' : ''} planned
          </p>
          
          {nextTrip && (
            <div className="mt-4 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="text-center">
                <p className="text-3xl font-bold">{daysUntilNext}</p>
                <p className="text-xs text-sage-200 uppercase tracking-wide">days until</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div>
                <p className="font-semibold">{nextTrip.name}</p>
                <p className="text-sm text-sage-200">{formatDateRange(nextTrip.startDate, nextTrip.endDate)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Filter & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['upcoming', 'past', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f 
                  ? 'bg-sage-500 text-white' 
                  : 'bg-cream-100 text-warm-600 hover:bg-cream-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Plan Trip</span>
        </button>
      </div>
      
      {/* Trip Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayTrips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onUpdate={handleUpdateTrip}
            isExpanded={expandedTrip === trip.id}
            onToggleExpand={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
          />
        ))}
      </div>
      
      {displayTrips.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream-100 flex items-center justify-center">
            <Palmtree className="w-8 h-8 text-sage-500" />
          </div>
          <h3 className="text-lg font-semibold text-warm-800 mb-2">No trips to show</h3>
          <p className="text-warm-500 mb-4">
            {filter === 'past' ? "You haven't completed any trips yet!" : "Time to plan your next adventure!"}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Plan Your First Trip
          </button>
        </div>
      )}
      
      {/* Quick Tips */}
      {upcomingTrips.length > 0 && (
        <div className="card bg-gradient-to-br from-cream-50 to-sage-50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-sage-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-sage-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-800 mb-2">Kate's Travel Tips</h3>
              <ul className="space-y-1.5 text-sm text-warm-600">
                <li className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-rose-gold-500" />
                  Check packing lists 1 week before departure
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sage-500" />
                  Download offline maps and boarding passes
                </li>
                <li className="flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-warm-500" />
                  Confirm all reservations 48 hours before
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTrip}
      />
    </div>
  )
}
