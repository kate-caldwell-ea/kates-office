import { API_URL, WS_URL } from '../config.js';
import { useEffect, useState, useRef } from 'react'
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Loader2,
  Info,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'


export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [senderName, setSenderName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    // Check if user has set their name before
    const savedName = localStorage.getItem('katesoffice_sender_name')
    if (savedName) {
      setSenderName(savedName)
      setShowNamePrompt(false)
    }
    
    fetchMessages()
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    
    ws.onopen = () => {
      setConnectionStatus('connected')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'chat_message') {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === data.data.id)) return prev
          return [...prev, data.data]
        })
        setLoading(false)
        
        // Speak response if voice is enabled
        if (voiceEnabled && data.data.role === 'assistant' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.data.content)
          utterance.rate = 1
          utterance.pitch = 1.1
          speechSynthesis.speak(utterance)
        }
      }
    }
    
    ws.onclose = () => {
      setConnectionStatus('disconnected')
      // Attempt reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }
    
    ws.onerror = () => {
      setConnectionStatus('error')
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/chat?limit=50`)
      const data = await res.json()
      setMessages(data)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSetName = (e) => {
    e.preventDefault()
    if (senderName.trim()) {
      localStorage.setItem('katesoffice_sender_name', senderName.trim())
      setShowNamePrompt(false)
    }
  }

  const sendMessage = async (content) => {
    if (!content.trim()) return
    
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content,
          senderName: senderName || 'Website Visitor'
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message')
      }
      
      // Message will be added via WebSocket broadcast
      // The loading state will be cleared when we receive the confirmation message
      setTimeout(() => {
        setLoading(prev => prev ? false : prev)
      }, 10000) // 10 second timeout fallback
      
    } catch (err) {
      console.error('Failed to send message:', err)
      setLoading(false)
      // Show error in chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: '⚠️ Failed to send message. Please try again.',
        created_at: new Date().toISOString()
      }])
    }
  }

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    setIsListening(true)
    recognition.start()
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-sage-400'
      case 'disconnected': return 'bg-amber-400'
      case 'error': return 'bg-red-400'
      default: return 'bg-warm-400'
    }
  }

  // Name prompt modal
  if (showNamePrompt) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-sm mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-warm-800">Chat with Kate</h2>
            <p className="text-warm-500 mt-2">What should I call you?</p>
          </div>
          
          <form onSubmit={handleSetName}>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your name..."
              className="w-full px-4 py-3 rounded-xl border border-cream-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={!senderName.trim()}
              className="w-full py-3 rounded-xl bg-sage-500 text-white font-medium hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start Chatting
            </button>
          </form>
          
          <button
            onClick={() => setShowNamePrompt(false)}
            className="w-full mt-3 py-2 text-sm text-warm-500 hover:text-warm-700"
          >
            Continue as Anonymous
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-warm-800">Chat with Kate</h1>
            <div className="flex items-center gap-2 text-sm text-warm-500">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
              <span>
                {connectionStatus === 'connected' ? 'Connected via Telegram' : 
                 connectionStatus === 'disconnected' ? 'Reconnecting...' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3 rounded-xl transition-colors ${
              voiceEnabled 
                ? 'bg-sage-100 text-sage-700' 
                : 'bg-cream-100 text-warm-500'
            }`}
            title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-sage-50 border border-sage-200 flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-warm-700">
          <p className="font-medium text-sage-700">📬 Direct Line to Kate</p>
          <p className="text-warm-600 mt-1">
            Messages are sent directly to Kate via <strong>Telegram</strong>. 
            She'll respond here or via Telegram — usually within minutes during business hours.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-cream-50 rounded-2xl p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-warm-400">
            <Sparkles className="w-12 h-12 mb-4 text-sage-300" />
            <p className="text-lg font-medium">Hey{senderName ? `, ${senderName}` : ''}! 👋</p>
            <p className="text-sm mt-1">I'm Kate, your personal assistant. How can I help?</p>
            <div className="mt-6 grid grid-cols-2 gap-2 max-w-md">
              <button 
                onClick={() => sendMessage("Hi Kate! Just wanted to say hello.")}
                className="p-3 rounded-xl bg-white shadow-sm border border-cream-200 text-sm text-warm-600 hover:bg-cream-50 transition-colors text-left"
              >
                👋 Say hello
              </button>
              <button 
                onClick={() => sendMessage("What can you help me with?")}
                className="p-3 rounded-xl bg-white shadow-sm border border-cream-200 text-sm text-warm-600 hover:bg-cream-50 transition-colors text-left"
              >
                ❓ What can you do?
              </button>
              <button 
                onClick={() => sendMessage("I have a question about Zack's work.")}
                className="p-3 rounded-xl bg-white shadow-sm border border-cream-200 text-sm text-warm-600 hover:bg-cream-50 transition-colors text-left"
              >
                💼 Work question
              </button>
              <button 
                onClick={() => sendMessage("I'd like to schedule something.")}
                className="p-3 rounded-xl bg-white shadow-sm border border-cream-200 text-sm text-warm-600 hover:bg-cream-50 transition-colors text-left"
              >
                📅 Schedule something
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-rose-gold-100' 
                  : message.role === 'system'
                    ? 'bg-amber-100'
                    : 'bg-sage-100'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-rose-gold-600" />
                ) : message.role === 'system' ? (
                  <Info className="w-5 h-5 text-amber-600" />
                ) : (
                  <Sparkles className="w-5 h-5 text-sage-600" />
                )}
              </div>

              {/* Message */}
              <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-sage-500 text-white rounded-tr-md'
                    : message.role === 'system'
                      ? 'bg-amber-50 border border-amber-200 rounded-tl-md'
                      : 'bg-white shadow-sm border border-cream-200 rounded-tl-md'
                }`}>
                  <p className={
                    message.role === 'user' 
                      ? 'text-white' 
                      : message.role === 'system'
                        ? 'text-amber-700'
                        : 'text-warm-700'
                  }>
                    {message.content}
                  </p>
                </div>
                <p className="text-xs text-warm-400 mt-1 px-2">
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-sage-600" />
            </div>
            <div className="bg-white shadow-sm border border-cream-200 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-2 text-warm-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Sending to Kate...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={toggleListening}
          className={`p-3 rounded-xl transition-all ${
            isListening 
              ? 'bg-red-100 text-red-600 animate-pulse' 
              : 'bg-cream-100 text-warm-500 hover:bg-cream-200'
          }`}
          title={isListening ? 'Stop listening' : 'Voice input'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
            placeholder={`Message Kate${senderName ? ` as ${senderName}` : ''}...`}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-cream-200 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-sage-500 text-white hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Status */}
      {isListening && (
        <div className="mt-2 text-center">
          <p className="text-sm text-warm-500 animate-pulse">🎤 Listening...</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 text-center">
        <p className="text-xs text-warm-400">
          {senderName && (
            <span>
              Chatting as <strong>{senderName}</strong> · 
              <button 
                onClick={() => {
                  localStorage.removeItem('katesoffice_sender_name')
                  setSenderName('')
                  setShowNamePrompt(true)
                }}
                className="ml-1 text-sage-600 hover:underline"
              >
                Change name
              </button>
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
