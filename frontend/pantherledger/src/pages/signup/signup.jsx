import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './signup.css'

const getStrength = (password) => {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']

const Signup = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const strength = getStrength(password)

  return (
    <div className="signup-page">
      {/* Back link */}
      <Link to="/" className="back-link">← Back to Home</Link>

      {/* Left panel */}
      <div className="signup-left">
        <div className="signup-logo-stack">
          <div className="logo-card logo-card--back" />
          <div className="logo-card logo-card--front">
            <span className="logo-dollar">$</span>
          </div>
        </div>
        <h1 className="signup-tagline">Roar Louder<br />Spend Smarter</h1>
      </div>

      {/* Right panel — form card */}
      <div className="signup-right">
        <div className="signup-card">
          <h2 className="signup-title">Create Your Account</h2>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" placeholder="" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" placeholder="" />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" />
            </div>
          </div>

          {/* Strength bar */}
          <div className="strength-bar">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`strength-segment ${i <= strength ? 'active' : ''}`}
              />
            ))}
          </div>
          {password && (
            <p className="strength-label">{strengthLabel[strength]}</p>
          )}

          {/* Terms checkbox */}
          <label className="terms-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="terms-link">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/terms" className="terms-link">Privacy Policy</Link>
            </span>
          </label>

          {/* Buttons */}
          <div className="signup-actions">
            <button className="btn-primary" onClick={() => navigate('/onboarding')}>Create Account</button>
            <button className="btn-google">Continue with Google</button>
          </div>

          {/* Login redirect */}
          <div className="login-redirect">
            <span>Have an account?</span>
            <Link to="/login" className="login-redirect-link">Log In →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
