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
} from 'lucide-react'

const API_URL = 'http://localhost:3847/api'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(`ws://localhost:3847/ws`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data.data])
      }
    }
    return () => ws.close()
  }, [])

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

  const sendMessage = async (content) => {
    if (!content.trim()) return
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Save to database
      await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content })
      })

      // Simulate Kate's response (in real implementation, this would connect to OpenClaw)
      setTimeout(async () => {
        const responses = [
          "I'm on it! Let me look into that for you.",
          "Great question! Let me check my notes...",
          "Absolutely, I can help with that. Give me a moment.",
          "Noted! I'll add this to the board right away.",
          "Let me pull up that information for you.",
        ]
        const kateResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responses[Math.floor(Math.random() * responses.length)],
          created_at: new Date().toISOString()
        }
        
        await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: kateResponse.content })
        })
        
        setMessages(prev => [...prev, kateResponse])
        setLoading(false)

        // Speak response if voice is enabled
        if (voiceEnabled && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(kateResponse.content)
          utterance.rate = 1
          utterance.pitch = 1.1
          speechSynthesis.speak(utterance)
        }
      }, 1000)
    } catch (err) {
      console.error('Failed to send message:', err)
      setLoading(false)
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
              <div className="w-2 h-2 rounded-full bg-sage-400 animate-pulse" />
              <span>Online and ready to help</span>
            </div>
          </div>
        </div>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-cream-50 rounded-2xl p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-warm-400">
            <Sparkles className="w-12 h-12 mb-4 text-sage-300" />
            <p className="text-lg font-medium">Hey there! 👋</p>
            <p className="text-sm mt-1">I'm Kate, your personal assistant. How can I help?</p>
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
                  : 'bg-sage-100'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-rose-gold-600" />
                ) : (
                  <Sparkles className="w-5 h-5 text-sage-600" />
                )}
              </div>

              {/* Message */}
              <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-sage-500 text-white rounded-tr-md'
                    : 'bg-white shadow-sm border border-cream-200 rounded-tl-md'
                }`}>
                  <p className={message.role === 'user' ? 'text-white' : 'text-warm-700'}>
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
                <span className="text-sm">Kate is typing...</span>
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
            placeholder="Message Kate..."
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
    </div>
  )
}
