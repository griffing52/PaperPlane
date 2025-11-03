import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/login'
import Signup from './components/Signup'

function App() {
  return (
    <Routes>
      {/* Default route: redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Placeholder dashboard for after login */}
      <Route path="/dashboard" element={<h2>Welcome to your dashboard!</h2>} />

      {/* Catch-all fallback */}
      <Route path="*" element={<h2>404 – Page Not Found</h2>} />
    </Routes>
  )
}

export default App
