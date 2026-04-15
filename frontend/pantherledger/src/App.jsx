import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import Signup from './pages/signup'
import Login from './pages/login'
import ForgotPassword from './pages/forgot-password'
import Terms from './pages/terms'
import Dashboard from './pages/dashboard'
import Onboarding from './pages/onboarding'
import Recurring from './pages/recurring'
import Upload from './pages/upload'
import Transactions from './pages/transactions'
import FeaturesPage from './pages/features'
import TeamPage from './pages/team'
import Spending from './pages/spending'
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
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/spending" element={<Spending />} />
      </Routes>
    </Router>
  )
}

export default App
