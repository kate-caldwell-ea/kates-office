import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import Expenses from './pages/Expenses'
import QAPI from './pages/QAPI'
import CronJobs from './pages/CronJobs'
import Questions from './pages/Questions'
import Security from './pages/Security'
import FamilyHub from './pages/FamilyHub'
import TravelPlanner from './pages/TravelPlanner'
import Settings from './pages/Settings'
import AIUsage from './pages/AIUsage'
import useAuthStore from './store/useAuthStore'

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-teal-400 text-lg animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assignments" element={<Kanban />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="questions" element={<Questions />} />
          <Route path="family" element={<FamilyHub />} />
          <Route path="travel" element={<TravelPlanner />} />
          <Route path="cron" element={<CronJobs />} />
          <Route path="qapi" element={<QAPI />} />
          <Route path="security" element={<Security />} />
          <Route path="ai-usage" element={<AIUsage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
