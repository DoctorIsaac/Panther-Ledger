import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setSession } from '../../api'
import './login.css'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/auth/login', { email, password })
      setSession({ user_id: data.user_id, username: data.username, first_name: data.first_name })
      navigate('/dashboard')
    } catch (err) {
      setError(err.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Link to="/" className="back-link">← Back to Home</Link>

      {/* Left panel */}
      <div className="login-left">
        <div className="login-logo-stack">
          <div className="logo-card logo-card--back" />
          <div className="logo-card logo-card--front">
            <span className="logo-dollar">$</span>
          </div>
        </div>
        <h1 className="login-tagline">Roar Louder<br />Spend Smarter</h1>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Log in to your account</h2>

          {/* Tab */}
          <div className="login-tabs">
            <button className="login-tab active">Email</button>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-row">
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>

            <label className="keep-label">
              <input type="checkbox" />
              <span>Keep me logged in</span>
            </label>

            <div className="login-actions">
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Logging in…' : 'Log In'}
              </button>
              <button className="btn-google" type="button">Continue with Google</button>
            </div>
          </form>

          <div className="signup-redirect">
            <span>New Here?</span>
            <Link to="/signup" className="signup-redirect-link">Sign Up →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
