import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function KateStatus() {
  const [status, setStatus] = useState({ status: 'ready', message: 'Ready to help', icon: '✨' })

  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${API_URL}/kate/status`)
        .then(res => res.json())
        .then(setStatus)
        .catch(() => {})
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 bg-teal-500/10 rounded-lg px-3 py-1.5 border border-teal-500/20">
      <div className="relative">
        <Sparkles className="w-4 h-4 text-teal-400" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border-2 border-dark-800" />
      </div>
      <div className="hidden sm:block">
        <span className="text-xs font-medium text-teal-300">Kate is</span>
        <span className="text-xs text-teal-400/70 ml-1">{status.message.toLowerCase()}</span>
      </div>
      <span className="sm:hidden text-xs">{status.icon}</span>
    </div>
  )
}
