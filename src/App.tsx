import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Calendar from './components/Calendar'
import AdminSettings from './components/AdminSettings'
import { AuthProvider } from './contexts/AuthContext'
import { EventProvider } from './contexts/EventContext'

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/admin" element={<AdminSettings />} />
              <Route path="/" element={<Navigate to="/calendar" replace />} />
            </Routes>
          </div>
        </Router>
      </EventProvider>
    </AuthProvider>
  )
}

export default App
