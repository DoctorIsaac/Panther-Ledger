import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setSession } from '../../api'
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

const NAME_REGEX    = /^[A-Za-z'-]+$/
const PHONE_REGEX   = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/
const ZIP_REGEX     = /^\d{5}$/

const Signup = () => {
  const navigate = useNavigate()

  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]         = useState('')
  const [username,        setUsername]         = useState('')
  const [email,           setEmail]            = useState('')
  const [phoneNumber,     setPhoneNumber]      = useState('')
  const [address,         setAddress]          = useState('')
  const [zipCode,         setZipCode]          = useState('')
  const [password,        setPassword]         = useState('')
  const [confirmPassword, setConfirmPassword]  = useState('')
  const [agreed,          setAgreed]           = useState(false)
  const [error,           setError]            = useState('')
  const [loading,         setLoading]          = useState(false)

  const strength = getStrength(password)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (!NAME_REGEX.test(firstName)) {
      setError('First name can only contain letters, hyphens, and apostrophes (no spaces or numbers).')
      return
    }
    if (!NAME_REGEX.test(lastName)) {
      setError('Last name can only contain letters, hyphens, and apostrophes (no spaces or numbers).')
      return
    }
    if (username.trim().length < 5 || username.trim().length > 25) {
      setError('Username must be between 5 and 25 characters.')
      return
    }
    if (!PHONE_REGEX.test(phoneNumber.trim())) {
      setError('Phone number must be a valid US format, e.g. 555-555-5555.')
      return
    }
    if (!address.trim()) {
      setError('Address cannot be empty.')
      return
    }
    if (address.trim().length > 100) {
      setError('Address must be at most 100 characters.')
      return
    }
    if (!ZIP_REGEX.test(zipCode.trim())) {
      setError('Zip code must be exactly 5 digits.')
      return
    }
    if (password.length < 5 || password.length > 15) {
      setError('Password must be between 5 and 15 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service.')
      return
    }

    setLoading(true)
    try {
      const data = await api.post('/auth/signup', {
        username,
        password,
        first_name:   firstName,
        last_name:    lastName,
        email,
        phone_number: phoneNumber.trim(),
        address:      address.trim(),
        zip_code:     zipCode.trim(),
      })
      setSession({ user_id: data.user_id, username: data.user_name, first_name: firstName, session_token: data.session_token })
      navigate('/onboarding')
    } catch (err) {
      setError(err.detail || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
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

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>}

          <form onSubmit={handleSignup}>

            {/* Row 1: First + Last name */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Row 2: Username */}
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="5–25 characters"
                required
              />
            </div>

            {/* Row 3: Email */}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>

            {/* Row 4: Phone */}
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="555-555-5555"
                required
              />
            </div>

            {/* Row 5: Address + Zip */}
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="33199"
                  maxLength={5}
                  required
                />
              </div>
            </div>

            {/* Row 6: Password + Confirm */}
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="5–15 characters"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
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
              <p className="strength-label">
                {strengthLabel[strength]}
                {password.length > 15 && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>— exceeds 15-char limit</span>}
                {password.length < 5 && password.length > 0 && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>— too short (min 5)</span>}
              </p>
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
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </div>
          </form>

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
