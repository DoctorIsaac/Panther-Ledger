import { Link } from 'react-router-dom'
import './header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <span className="logo-text">Panther Ledger</span>
        </div>
        <nav className="nav">
          <ul>
            <li><Link to="/login" className="login-link">Log In</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
