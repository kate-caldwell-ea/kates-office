import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const shortcuts = {
  '1': '/',
  '2': '/assignments',
  '3': '/expenses',
  '4': '/questions',
  '5': '/cron',
}

export function useKeyboardShortcuts({ 
  onCommandPalette, 
  onNewTask, 
  onNewExpense,
  onCloseModal,
  modalOpen = false 
}) {
  const navigate = useNavigate()

  const handleKeyDown = useCallback((e) => {
    // Ignore if typing in an input/textarea
    const target = e.target
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable

    // Always handle Escape
    if (e.key === 'Escape') {
      onCloseModal?.()
      return
    }

    // Command/Ctrl + K for command palette (works even in inputs)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      onCommandPalette?.()
      return
    }

    // Skip other shortcuts if in input or modal is open
    if (isInput || modalOpen) return

    // Number keys for navigation
    if (shortcuts[e.key]) {
      e.preventDefault()
      navigate(shortcuts[e.key])
      return
    }

    // N for new task
    if (e.key.toLowerCase() === 'n') {
      e.preventDefault()
      onNewTask?.()
      return
    }

    // E for new expense
    if (e.key.toLowerCase() === 'e') {
      e.preventDefault()
      onNewExpense?.()
      return
    }

    // ? for showing shortcuts help (future enhancement)
    if (e.key === '?') {
      // Could show a shortcuts modal
    }
  }, [navigate, onCommandPalette, onNewTask, onNewExpense, onCloseModal, modalOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default useKeyboardShortcuts
