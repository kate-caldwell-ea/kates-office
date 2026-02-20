import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import Expenses from './pages/Expenses'
import QAPI from './pages/QAPI'
import Chat from './pages/Chat'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assignments" element={<Kanban />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="qapi" element={<QAPI />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
