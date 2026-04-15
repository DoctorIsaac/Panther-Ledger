import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getSession, clearSession } from '../../api'
import './dashboard.css'

/* ── Spend chart helpers ── */
function buildDailyChart(expenses, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daily = new Array(daysInMonth + 1).fill(0)
  for (const e of expenses) {
    if (e.expense_type !== 'expense' || !e.purchase_date) continue
    const d = new Date(e.purchase_date + 'T00:00:00')
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    daily[d.getDate()] += e.amount || 0
  }
  const cumDaily = []
  let cum = 0
  for (let i = 0; i <= daysInMonth; i++) {
    cum += daily[i]
    cumDaily.push(cum)
  }
  return { cumDaily, daysInMonth, total: cum }
}

function makeChartPaths(cumDaily, daysInMonth, maxVal, upToDay) {
  const xMin = 5, xMax = 248, yBottom = 84, yTop = 22
  const safe = maxVal || 1
  const limit = Math.min(upToDay ?? daysInMonth, daysInMonth)
  const pts = []
  for (let i = 0; i <= limit; i++) {
    const x = +(xMin + (i / daysInMonth) * (xMax - xMin)).toFixed(1)
    const y = +(yBottom - ((cumDaily[i] || 0) / safe) * (yBottom - yTop)).toFixed(1)
    pts.push([x, y])
  }
  if (pts.length < 2) return { line: '', area: '', dot: null }
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ')
  const last = pts[pts.length - 1]
  const area = `${line} L ${last[0]},${yBottom} L ${pts[0][0]},${yBottom} Z`
  return { line, area, dot: last }
}

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

/* ── Greeting ── */
const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Pie chart data ── */
const PIE_COLORS = ['#081E3F', '#B5934C', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#06b6d4']

function buildPieData(expenses) {
  const totals = {}
  for (const e of expenses) {
    if (e.expense_type !== 'expense') continue
    const cat = e.category_name || 'Other'
    totals[cat] = (totals[cat] || 0) + (e.amount || 0)
  }
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1
  return entries.map(([label, amount], i) => ({
    label,
    amount: Math.round(amount),
    color: PIE_COLORS[i % PIE_COLORS.length],
    pct: amount / total,
  }))
}

/* ── Donut pie chart ── */
function PieChart({ slices, total }) {
  const cx = 70, cy = 70, outerR = 58, innerR = 34
  let angle = -Math.PI / 2
  const [hovered, setHovered] = useState(null)

  if (slices.length === 0) {
    return (
      <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
        <circle cx={cx} cy={cy} r={outerR} fill="#f3f4f6" />
        <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="#9ca3af">No data</text>
      </svg>
    )
  }

  const paths = slices.map((slice, i) => {
    const start = angle
    const sweep = slice.pct * 2 * Math.PI
    angle += sweep
    const end = angle
    const large = sweep > Math.PI ? 1 : 0
    const scale = hovered === i ? 1.04 : 1
    const ox1 = cx + outerR * scale * Math.cos(start), oy1 = cy + outerR * scale * Math.sin(start)
    const ox2 = cx + outerR * scale * Math.cos(end),   oy2 = cy + outerR * scale * Math.sin(end)
    const ix1 = cx + innerR * Math.cos(start),          iy1 = cy + innerR * Math.sin(start)
    const ix2 = cx + innerR * Math.cos(end),            iy2 = cy + innerR * Math.sin(end)
    return (
      <path
        key={i}
        d={`M ${ox1} ${oy1} A ${outerR * scale} ${outerR * scale} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`}
        fill={slice.color}
        style={{ cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
      />
    )
  })

  const activeSlice = hovered !== null ? slices[hovered] : null

  return (
    <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, overflow: 'visible' }}>
      {paths}
      <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
      {activeSlice ? (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill="#6b7280" style={{ textTransform: 'uppercase' }}>
            {activeSlice.label.length > 10 ? activeSlice.label.slice(0, 10) + '…' : activeSlice.label}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#111827">
            ${activeSlice.amount}
          </text>
          <text x={cx} y={cy + 20} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {Math.round(activeSlice.pct * 100)}%
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill="#6b7280">TOTAL</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fontWeight="600" fill="#111827">
            ${total}
          </text>
        </>
      )}
    </svg>
  )
}

/* ── Format date ── */
function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── Recurring helpers ── */
function nextOccurrence(purchaseDateStr, frequency) {
  if (!purchaseDateStr) return null
  const d = new Date(purchaseDateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = frequency === 'weekly' ? 7 : frequency === 'bi-weekly' ? 14 : 30
  while (d <= today) d.setDate(d.getDate() + days)
  return d
}



/* ── Dashboard calendar ── */
function DashCalendar({ items }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const incomeDays = new Set()
  const billDays = new Set()
  for (const item of items) {
    const next = nextOccurrence(item.purchase_date, item.frequency)
    if (!next) continue
    if (next.getMonth() === month && next.getFullYear() === year) {
      if (item.expense_type === 'deposit') incomeDays.add(next.getDate())
      else billDays.add(next.getDate())
    }
  }

  const totalCells = firstDay + daysInMonth
  const cells = Array.from({ length: Math.ceil(totalCells / 7) * 7 }, (_, i) => {
    const day = i - firstDay + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const today = now.getDate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        {monthName}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `auto repeat(${Math.ceil(cells.length / 7)}, 1fr)`, flex: 1, gap: 2 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <span key={i} style={{ textAlign: 'center', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, paddingBottom: 4 }}>{d}</span>
        ))}
        {cells.map((day, i) => (
          <div key={i} style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: !day ? 'transparent' : day === today ? '#fff' : '#374151',
            background: day === today ? '#081E3F' : 'transparent',
            borderRadius: 6,
            fontWeight: day === today ? 600 : 400,
          }}>
            {day || ''}
            {day && (billDays.has(day) || incomeDays.has(day)) && (
              <span style={{
                position: 'absolute',
                bottom: 3,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: billDays.has(day) && incomeDays.has(day)
                  ? '#f97316'
                  : billDays.has(day) ? '#ef4444' : '#22c55e',
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#6b7280' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />Bill
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#6b7280' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />Income
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#6b7280' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />Both
        </span>
      </div>
    </div>
  )
}

/* ── Dashboard ── */
const Dashboard = () => {
  const navigate = useNavigate()
  const session = getSession()
  const [activeNav, setActiveNav] = useState('dashboard')
  const [expenses, setExpenses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [recurring, setRecurring] = useState([])
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
      api.get(`/recurring/${session.user_id}`),
    ])
      .then(([exp, anal, rec]) => {
        setExpenses(Array.isArray(exp) ? exp : [])
        setAnalytics(anal)
        setRecurring(Array.isArray(rec) ? rec : [])
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [])

  const handleLogout = () => {
    clearSession()
    navigate('/login')
  }

  const pieData = buildPieData(expenses)
  const pieTotal = pieData.reduce((s, c) => s + c.amount, 0)

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear
  const today     = now.getDate()

  const thisChart  = buildDailyChart(expenses, thisYear, thisMonth)
  const lastChart  = buildDailyChart(expenses, lastYear, lastMonth)
  const chartMax   = Math.max(thisChart.total, lastChart.total, 1)
  const thisPaths  = makeChartPaths(thisChart.cumDaily, thisChart.daysInMonth, chartMax, today)
  const lastPaths  = makeChartPaths(lastChart.cumDaily, lastChart.daysInMonth, chartMax)

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
    { id: 'spending', label: 'Spending', icon: 'activity', path: '/spending' },
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
              onClick={() => item.path ? navigate(item.path) : setActiveNav(item.id)}
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
                    <path d={thisPaths.area} fill="url(#areaGrad)" />
                    <path d={lastPaths.line} fill="none" stroke="#B5934C" strokeWidth="2" strokeDasharray="5 3" />
                    <path d={thisPaths.line} fill="none" stroke="#081E3F" strokeWidth="2.5" />
                    {thisPaths.dot && (
                      <circle cx={thisPaths.dot[0]} cy={thisPaths.dot[1]} r="4" fill="#081E3F" stroke="#fff" strokeWidth="2" />
                    )}
                  </svg>

                  <div className="chart-x-labels">
                    <span>1st</span><span>8th</span><span>16th</span><span>24th</span>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-line solid" />This Month</span>
                    <span className="legend-item"><span className="legend-line dashed" />Last Month</span>
                  </div>
                </div>

                {/* Card 2 — Category Pie */}
                <div className="card">
                  <p className="card-eyebrow">Spending by Category</p>
                  {pieData.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>No expenses this month.</p>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
                      <PieChart slices={pieData} total={pieTotal} />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom 2-col cards */}
              <div className="cards-bottom">

                {/* Card — Recent Transactions */}
                <div className="card">
                  <div className="card-header-row">
                    <p className="card-eyebrow">Recent Transactions</p>
                    <button className="card-link-btn" onClick={() => navigate('/transactions')}>
                      <Icon name="arrow-right" size={16} />
                    </button>
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
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header-row">
                    <p className="card-eyebrow">Upcoming</p>
                    <button className="card-link-btn" onClick={() => navigate('/recurring')}>
                      <Icon name="arrow-right" size={16} />
                    </button>
                  </div>
                  <DashCalendar items={recurring} />
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
