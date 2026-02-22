import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Expenses from './pages/Expenses';
import QAPI from './pages/QAPI';
import Chat from './pages/Chat';
import CronJobs from './pages/CronJobs';
import Questions from './pages/Questions';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import useAuthStore from './store/useAuthStore';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, authRequired, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-4 animate-pulse">
            <span className="text-3xl">🏠</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is not required (no password set), allow access
  if (!authRequired) {
    return children;
  }

  // If auth is required but not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const { checkAuth, isAuthenticated, authRequired } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public login route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated || !authRequired ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="assignments" element={<Kanban />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="questions" element={<Questions />} />
          <Route path="cron" element={<CronJobs />} />
          <Route path="qapi" element={<QAPI />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
