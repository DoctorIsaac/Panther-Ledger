import { Link } from 'react-router-dom'
import './Header.css'
import logo from '../../assets/logo.png'

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src={logo} alt="LifeSync Logo" className="logo-image" />
        </div>
        <nav className="nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/login" className="login-link">Login</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header