import { Link } from 'react-router-dom'
import './header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo-text">Panther Ledger</Link>
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/team" className="nav-link">Meet the Team</Link>
        </div>
        <div className="header-right">
          <Link to="/login" className="nav-link">Log In</Link>
          <Link to="/signup" className="signup-btn">Sign Up</Link>
        </div>
      </div>
    </header>
  )
}

export default Header
