import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getSession, clearSession } from '../../api'
import './dashboard.css'

/* ── Static fallback accounts ── */
const ACCOUNTS = [
  { label: 'Checking',     sub: 'Wells Fargo',    amount: '$342',   amountColor: '#081E3F', iconBg: '#e5e7eb', iconColor: '#6b7280' },
  { label: 'Card Balance', sub: 'Chase Sapphire', amount: '-$808',  amountColor: '#ef4444', iconBg: '#fef3c7', iconColor: '#d97706' },
  { label: 'Savings',      sub: 'Ally Bank',      amount: '$4,139', amountColor: '#081E3F', iconBg: '#dcfce7', iconColor: '#16a34a' },
  { label: 'Investments',  sub: 'Not linked',     amount: '+ Add',  amountColor: '#B5934C', iconBg: '#f3f4f6', iconColor: '#9ca3af', isAdd: true },
]

/* ── SVG chart paths ── */
const AREA_PATH  = 'M 5,78 C 40,77 70,74 100,68 C 130,62 155,52 180,40 C 200,30 225,23 248,19 L 248,84 L 5,84 Z'
const THIS_MONTH = 'M 5,78 C 40,77 70,74 100,68 C 130,62 155,52 180,40 C 200,30 225,23 248,19'
const LAST_MONTH = 'M 5,79 C 40,78 70,77 100,74 C 130,71 155,67 180,63 C 200,60 225,57 248,54'

/* ── Icons ── */
const Icon = ({ name, size = 18 }) => {
  const s = { width: size, height: size }
  const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'grid':        return <svg style={s} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    case 'dollar':      return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    case 'users':       return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'card':        return <svg style={s} viewBox="0 0 24 24" {...base}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'activity':    return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    case 'bell':        return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    case 'search':      return <svg style={s} viewBox="0 0 24 24" {...base}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    case 'send':        return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    case 'box':         return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    case 'heart':       return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    case 'bag':         return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    case 'trending':    return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
    case 'arrow-right': return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    case 'chat':        return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'logout':      return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'upload':      return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    default:            return null
  }
}

const accountIcons = ['card', 'card', 'dollar', 'trending']

/* ── Greeting ── */
const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Spending breakdown from expenses ── */
function buildSpending(expenses) {
  const totals = {}
  for (const e of expenses) {
    if (e.expense_type !== 'expense') continue
    const cat = e.category_name || 'Other'
    totals[cat] = (totals[cat] || 0) + (e.amount || 0)
  }
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = entries[0]?.[1] || 1
  const colors = ['#081E3F', '#B5934C', '#ef4444', '#22c55e', '#9ca3af']
  return entries.map(([label, amount], i) => ({
    label,
    amount: Math.round(amount),
    color: colors[i] || '#9ca3af',
    pct: Math.round((amount / max) * 100),
  }))
}

/* ── Format date ── */
function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── Dashboard ── */
const Dashboard = () => {
  const navigate = useNavigate()
  const session = getSession()
  const [activeNav, setActiveNav] = useState('dashboard')
  const [expenses, setExpenses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!session) {
      navigate('/login')
      return
    }

    const now = new Date()
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const endDate = tomorrow.toISOString().slice(0, 10)

    Promise.all([
      api.get(`/expenses/${session.user_id}`),
      api.get(`/analytics/${session.user_id}?start_date=${startOfMonth}&end_date=${endDate}`),
    ])
      .then(([exp, anal]) => {
        setExpenses(Array.isArray(exp) ? exp : [])
        setAnalytics(anal)
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [])

  const handleLogout = () => {
    clearSession()
    navigate('/login')
  }

  const spending = buildSpending(expenses)
  const recentTx = [...expenses]
    .sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''))
    .slice(0, 5)

  const totalSpend = analytics ? `$${analytics.total_expenses.toLocaleString()}` : '—'
  const firstName = session?.first_name || session?.username || 'there'

  const mainNav = [
    { id: 'dashboard',    label: 'Dashboard',    icon: 'grid',   path: null          },
    { id: 'transactions', label: 'Transactions', icon: 'dollar', path: '/transactions' },
    { id: 'recurring',    label: 'Recurring',    icon: 'users',  path: '/recurring'  },
    { id: 'upload',       label: 'Upload',       icon: 'upload', path: '/upload'     },
  ]
  const financeNav = [
    { id: 'accounts', label: 'Accounts', icon: 'card'     },
    { id: 'spending', label: 'Spending', icon: 'activity' },
  ]

  return (
    <div className="dash-wrap">

      {/* ── Top navbar ── */}
      <header className="dash-nav">
        <Link to="/" className="dash-brand">Panther Ledger</Link>
        <div className="dash-nav-right">
          <button className="dash-icon-btn"><Icon name="bell" /></button>
          <button className="dash-icon-btn"><Icon name="search" /></button>
          <button className="dash-icon-btn" onClick={handleLogout} title="Log out"><Icon name="logout" /></button>
          <div className="dash-avatar">
            {firstName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="dash-body">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <p className="sidebar-section-label">Main</p>
          {mainNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => item.path ? navigate(item.path) : setActiveNav(item.id)}
            >
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}

          <p className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Finance</p>
          {financeNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}

        </aside>

        {/* ── Main content ── */}
        <main className="dash-main">
          <h1 className="dash-greeting">
            {getGreeting()}, <span className="dash-name">{firstName}</span> 👋
          </h1>

          {loadingData ? (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading your data…</p>
          ) : (
            <>
              {/* Top 3-col cards */}
              <div className="cards-top">

                {/* Card 1 — Current Spend */}
                <div className="card">
                  <div className="card-header-row">
                    <p className="card-eyebrow">Current Spend — This Month</p>
                    <span className="card-info">ⓘ</span>
                  </div>
                  <p className="spend-amount">{totalSpend}</p>
                  {analytics && (
                    <p className="spend-trend">
                      Net: {analytics.net >= 0 ? '+' : ''}${analytics.net.toLocaleString()} · {analytics.count} transactions
                    </p>
                  )}

                  <svg className="spend-chart" viewBox="0 0 253 90" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#081E3F" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#081E3F" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>
                    <path d={AREA_PATH} fill="url(#areaGrad)" />
                    <path d={LAST_MONTH} fill="none" stroke="#B5934C" strokeWidth="2" strokeDasharray="5 3" />
                    <path d={THIS_MONTH} fill="none" stroke="#081E3F" strokeWidth="2.5" />
                    <circle cx="213" cy="28" r="4" fill="#081E3F" stroke="#fff" strokeWidth="2" />
                  </svg>

                  <div className="chart-x-labels">
                    <span>1st</span><span>8th</span><span>16th</span><span>24th</span>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-line solid" />This Month</span>
                    <span className="legend-item"><span className="legend-line dashed" />Last Month</span>
                  </div>
                </div>

                {/* Card 2 — Spending Breakdown */}
                <div className="card">
                  <p className="card-eyebrow">Spending Breakdown</p>
                  {spending.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>No expenses this month.</p>
                  ) : (
                    <div className="breakdown-list">
                      {spending.map((cat) => (
                        <div className="breakdown-row" key={cat.label}>
                          <div className="breakdown-icon">
                            <Icon name="send" size={16} />
                          </div>
                          <div className="breakdown-info">
                            <div className="breakdown-top">
                              <span className="breakdown-label">{cat.label}</span>
                              <span className="breakdown-amount">${cat.amount}</span>
                            </div>
                            <div className="breakdown-bar-bg">
                              <div className="breakdown-bar-fill" style={{ width: `${cat.pct}%`, background: cat.color }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card 3 — Accounts */}
                <div className="card">
                  <div className="card-header-row">
                    <p className="card-eyebrow">Accounts</p>
                  </div>
                  <p className="accounts-updated">Static · <span className="accounts-sync">Sync</span></p>
                  <div className="accounts-list">
                    {ACCOUNTS.map((acc, i) => (
                      <div className="account-row" key={acc.label}>
                        <div className="account-icon" style={{ background: acc.iconBg, color: acc.iconColor }}>
                          <Icon name={accountIcons[i]} size={16} />
                        </div>
                        <div className="account-info">
                          <span className="account-label">{acc.label}</span>
                          <span className="account-sub">{acc.sub}</span>
                        </div>
                        <span className="account-amount" style={{ color: acc.amountColor }}>
                          {acc.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom 2-col cards */}
              <div className="cards-bottom">

                {/* Card — Recent Transactions */}
                <div className="card">
                  <div className="card-header-row">
                    <p className="card-eyebrow">Recent Transactions</p>
                    <button className="card-link-btn"><Icon name="arrow-right" size={16} /></button>
                  </div>
                  {recentTx.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>No transactions yet.</p>
                  ) : (
                    <div className="tx-list">
                      {recentTx.map((tx, idx) => {
                        const initials = tx.name ? tx.name.slice(0, 2).toUpperCase() : '??'
                        const isDeposit = tx.expense_type === 'deposit'
                        const bgColors = ['#bfdbfe', '#bbf7d0', '#e0e7ff', '#fce7f3', '#fef3c7']
                        return (
                          <div className="tx-row" key={idx}>
                            <div className="tx-avatar" style={{ background: bgColors[idx % bgColors.length] }}>{initials}</div>
                            <div className="tx-info">
                              <div className="tx-top">
                                <span className="tx-label" style={{ textTransform: 'capitalize' }}>{tx.name}</span>
                                <span className="tx-status-pill" style={{ color: '#22c55e', background: '#22c55e22' }}>
                                  Completed
                                </span>
                              </div>
                              <span className="tx-sub">{tx.category_name || 'Uncategorized'}</span>
                            </div>
                            <div className="tx-right">
                              <span className="tx-amount" style={{ color: isDeposit ? '#22c55e' : 'inherit' }}>
                                {isDeposit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                              </span>
                              <span className="tx-date">{fmtDate(tx.purchase_date)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Card — Upcoming */}
                <div className="card">
                  <p className="card-eyebrow">Upcoming</p>
                  <span className="upcoming-pill">Payday in 3 days</span>
                  <p className="upcoming-desc">
                    2 recurring charges due in the next 7 days totaling $24.98.
                  </p>
                  <div className="upcoming-items">
                    <div className="upcoming-item">
                      <span className="upcoming-item-label">Spotify</span>
                      <span className="upcoming-item-date">Apr 1 · $9.99</span>
                    </div>
                    <div className="upcoming-item">
                      <span className="upcoming-item-label">iCloud</span>
                      <span className="upcoming-item-date">Apr 2 · $14.99</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <p className="dash-footer-text">Florida International University</p>
        </main>
      </div>

      {/* Floating chat button */}
      <button className="chat-fab">
        <Icon name="chat" size={20} />
        <span className="chat-dot" />
      </button>
    </div>
  )
}

export default Dashboard
