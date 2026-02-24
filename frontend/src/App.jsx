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
import BennettTracker from './pages/BennettTracker'
import GiftTracker from './pages/GiftTracker'
import useAuthStore from './store/useAuthStore'

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{color:'#2dd4bf',fontSize:'18px'}}>Loading...</div>
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
          <Route path="bennett" element={<BennettTracker />} />
          <Route path="gifts" element={<GiftTracker />} />
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
