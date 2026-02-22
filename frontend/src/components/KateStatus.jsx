import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function KateStatus() {
  const [status, setStatus] = useState({ status: 'ready', message: 'Ready to help', icon: '✨' })

  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${API_URL}/kate/status`)
        .then(res => res.json())
        .then(setStatus)
        .catch(() => {}) // Silently fail
    }
    
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Update every 30s
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
      <div className="relative">
        <Sparkles className="w-5 h-5 text-white" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white/20" />
      </div>
      <div className="hidden sm:block">
        <span className="text-sm font-medium text-white">Kate is</span>
        <span className="text-sm text-white/80 ml-1">{status.message.toLowerCase()}</span>
      </div>
      <span className="sm:hidden">{status.icon}</span>
    </div>
  )
}
