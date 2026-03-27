import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import Signup from './pages/signup'
import Login from './pages/login'
import ForgotPassword from './pages/forgot-password'
import Terms from './pages/terms'
import Dashboard from './pages/dashboard'
import Onboarding from './pages/onboarding'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </Router>
  )

}
export default App
