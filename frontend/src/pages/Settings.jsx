import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Palette,
  Shield,
  Mail,
  Calendar,
  Smartphone,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
} from 'lucide-react'

export default function Settings() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  
  const settingsSections = [
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          label: 'Dark Mode',
          description: 'Coming soon — Kate is working on it!',
          icon: darkMode ? Moon : Sun,
          value: darkMode,
          disabled: true,
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Push Notifications',
          description: 'Get alerts for important events and reminders',
          icon: Bell,
          value: notifications,
          onChange: () => setNotifications(!notifications),
        },
        {
          label: 'Voice Responses',
          description: 'Kate reads responses aloud in chat',
          icon: voiceEnabled ? Volume2 : VolumeX,
          value: voiceEnabled,
          onChange: () => setVoiceEnabled(!voiceEnabled),
        },
      ],
    },
    {
      title: 'Integrations',
      icon: Calendar,
      items: [
        {
          label: 'Google Calendar',
          description: 'Connected via OAuth',
          icon: Calendar,
          status: 'Connected',
          statusColor: 'text-green-600 bg-green-100',
        },
        {
          label: 'Email (Gmail)',
          description: 'Connected for inbox monitoring',
          icon: Mail,
          status: 'Connected',
          statusColor: 'text-green-600 bg-green-100',
        },
        {
          label: 'Telegram',
          description: 'Primary chat channel',
          icon: Smartphone,
          status: 'Active',
          statusColor: 'text-sage-600 bg-sage-100',
        },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        {
          label: 'Authentication',
          description: 'Password-protected access',
          icon: Shield,
          status: 'Enabled',
          statusColor: 'text-green-600 bg-green-100',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-sage-100 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-sage-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-warm-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Settings
          </h1>
          <p className="text-warm-500">Customize Kate's Office to work your way</p>
        </div>
      </div>
      
      {/* Profile Card */}
      <div className="card bg-gradient-to-br from-sage-50 to-cream-50 border-sage-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-warm-800">Kate</h2>
            <p className="text-warm-500">Your Personal Assistant</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-green-600">Online & Ready</span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-gold-100 text-rose-gold-700 rounded-full text-sm">
              <Heart className="w-4 h-4" />
              <span>At your service</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Sections */}
      {settingsSections.map((section, idx) => (
        <div key={idx} className="card">
          <div className="flex items-center gap-2 mb-4">
            <section.icon className="w-5 h-5 text-sage-500" />
            <h2 className="font-semibold text-warm-800">{section.title}</h2>
          </div>
          
          <div className="space-y-1">
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  item.disabled ? 'opacity-50' : 'hover:bg-cream-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-warm-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-warm-800">{item.label}</p>
                    <p className="text-sm text-warm-500 truncate">{item.description}</p>
                  </div>
                </div>
                
                {item.onChange !== undefined ? (
                  <button
                    onClick={item.onChange}
                    disabled={item.disabled}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                      item.value ? 'bg-sage-500' : 'bg-warm-200'
                    } ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        item.value ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : item.status ? (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${item.statusColor}`}>
                    {item.status}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* About Section */}
      <div className="card text-center bg-cream-50 border-cream-200">
        <p className="text-warm-600 text-sm">
          Kate's Office v1.0 — Built with 💕 for Zack
        </p>
        <p className="text-warm-400 text-xs mt-1">
          © 2026 Kate (AI Assistant)
        </p>
      </div>
    </div>
  )
}
