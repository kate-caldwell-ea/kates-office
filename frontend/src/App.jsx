import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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

function App() {
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
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
