import { Link, useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '../../api'
import Icon from './Icon'
import '../../pages/dashboard/dashboard.css'

const MAIN_NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'grid',   path: '/dashboard'    },
  { id: 'transactions', label: 'Transactions', icon: 'dollar', path: '/transactions' },
  { id: 'recurring',    label: 'Recurring',    icon: 'users',  path: '/recurring'    },
  { id: 'upload',       label: 'Upload',       icon: 'upload', path: '/upload'       },
]

const FINANCE_NAV = [
  { id: 'accounts', label: 'Accounts', icon: 'card',     path: null        },
  { id: 'spending', label: 'Spending', icon: 'activity', path: '/spending' },
]

const AppLayout = ({ activeNav, children }) => {
  const navigate = useNavigate()
  const session = getSession()
  const firstName = session?.first_name || session?.username || 'there'

  const handleLogout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="dash-wrap">

      <header className="dash-nav">
        <Link to="/" className="dash-brand">Panther Ledger</Link>
        <div className="dash-nav-right">
          <button className="dash-icon-btn"><Icon name="bell" /></button>
          <button className="dash-icon-btn"><Icon name="search" /></button>
          <button className="dash-icon-btn" onClick={handleLogout} title="Log out">
            <Icon name="logout" />
          </button>
          <div className="dash-avatar">{firstName.slice(0, 2).toUpperCase()}</div>
        </div>
      </header>

      <div className="dash-body">

        <aside className="dash-sidebar">
          <p className="sidebar-section-label">Main</p>
          {MAIN_NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}

          <p className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Finance</p>
          {FINANCE_NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => item.path ? navigate(item.path) : null}
            >
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="dash-main">
          {children}
        </main>

      </div>

      <button className="chat-fab">
        <Icon name="chat" size={20} />
        <span className="chat-dot" />
      </button>

    </div>
  )
}

export default AppLayout
