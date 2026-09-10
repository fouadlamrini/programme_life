import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import ChangePassword from './pages/ChangePassword'
import Activities from './pages/Activities'
import SleepSettings from './pages/SleepSettings'

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/activities" element={<Activities />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/change-password" element={<ChangePassword />} />
      <Route path="/settings/sleep" element={<SleepSettings />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App