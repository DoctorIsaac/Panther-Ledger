import { Link, useNavigate } from 'react-router-dom'
import './login.css'

const Login = () => {
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    navigate('/dashboard')
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

          <div className="form-group">
            <label>Email</label>
            <input type="email" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" />
          </div>

          <div className="forgot-row">
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>

          <label className="keep-label">
            <input type="checkbox" />
            <span>Keep me logged in</span>
          </label>

          <div className="login-actions">
            <button className="btn-primary" onClick={handleLogin}>Log In</button>
            <button className="btn-google">Continue with Google</button>
          </div>

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
