import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getSession, clearSession } from '../../api'
import '../dashboard/dashboard.css'
import './recurring.css'

/* ── Avatar color palette (cycles by index) ── */
const AVATAR_PALETTE = [
  { bg: '#d1fae5', color: '#059669' },
  { bg: '#e0e7ff', color: '#4f46e5' },
  { bg: '#fef9c3', color: '#ca8a04' },
  { bg: '#fae8ff', color: '#a21caf' },
  { bg: '#fee2e2', color: '#dc2626' },
  { bg: '#e0f2fe', color: '#0284c7' },
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#dcfce7', color: '#16a34a' },
]

/* ── Category badge color palette ── */
const CAT_COLORS = [
  { color: '#059669', bg: '#d1fae5' },
  { color: '#7c3aed', bg: '#ede9fe' },
  { color: '#0284c7', bg: '#e0f2fe' },
  { color: '#a21caf', bg: '#fae8ff' },
  { color: '#d97706', bg: '#fef3c7' },
  { color: '#dc2626', bg: '#fee2e2' },
]

/* ── Compute next occurrence after today ── */
function nextOccurrence(purchaseDateStr, frequency) {
  if (!purchaseDateStr) return null
  const d = new Date(purchaseDateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = frequency === 'weekly' ? 7 : frequency === 'bi-weekly' ? 14 : 30
  while (d <= today) d.setDate(d.getDate() + days)
  return d
}

function fmtShort(date) {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isDueSoon(date) {
  if (!date) return false
  const diff = (date - new Date()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}

/* ── Calendar ── */
const Calendar = ({ items }) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

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
  const rows = Math.ceil(totalCells / 7)
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const day = i - firstDay + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  return (
    <div className="rc-calendar">
      <p className="rc-calendar-month">{monthName}</p>
      <div className="rc-cal-grid">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <span key={i} className="rc-cal-header">{d}</span>
        ))}
        {cells.map((day, i) => (
          <span key={i} className={`rc-cal-day ${!day ? 'empty' : ''} ${day === now.getDate() ? 'today' : ''}`}>
            {day || ''}
            {day && incomeDays.has(day) && <span className="rc-cal-dot income" />}
            {day && billDays.has(day)   && <span className="rc-cal-dot bill" />}
          </span>
        ))}
      </div>
      <div className="rc-cal-legend">
        <span className="rc-legend-item"><span className="rc-legend-dot bill" />Bill due</span>
        <span className="rc-legend-item"><span className="rc-legend-dot income" />Income</span>
      </div>
    </div>
  )
}

/* ── Icons ── */
const Icon = ({ name, size = 18 }) => {
  const s = { width: size, height: size }
  const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'grid':         return <svg style={s} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    case 'dollar':       return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    case 'users':        return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'card':         return <svg style={s} viewBox="0 0 24 24" {...base}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'activity':     return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    case 'bell':         return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    case 'search':       return <svg style={s} viewBox="0 0 24 24" {...base}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    case 'chat':         return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'chevron-down': return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="6 9 12 15 18 9"/></svg>
    case 'plus':         return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'repeat':       return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    case 'upload':       return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    default:             return null
  }
}

/* ── Toggle switch ── */
const Toggle = ({ checked, onChange }) => (
  <button className={`rc-toggle ${checked ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={checked} />
)

/* ── Recurring Page ── */
const Recurring = () => {
  const navigate = useNavigate()
  const session = getSession()

  const userInitials = session
    ? (session.first_name?.[0] || session.username?.[0] || '?').toUpperCase()
    : '?'

  const logout = () => { clearSession(); navigate('/login') }

  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeStates, setActiveStates] = useState({})

  useEffect(() => {
    if (!session) { navigate('/login'); return }
    api.get(`/recurring/${session.user_id}`)
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setItems(list)
        setActiveStates(Object.fromEntries(list.map(r => [r.expense_id, true])))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleItem = (id) => setActiveStates(prev => ({ ...prev, [id]: !prev[id] }))

  /* Filters */
  const [tab,        setTab]        = useState('all')
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [freqFilter, setFreqFilter] = useState('')
  const [openDrop,   setOpenDrop]   = useState(null)

  const CATEGORIES  = useMemo(() => [...new Set(items.map(r => r.category_name).filter(Boolean))], [items])
  const FREQUENCIES = ['monthly', 'bi-weekly', 'weekly']

  const filtered = useMemo(() => {
    let list = items
    if (tab === 'income')  list = list.filter(r => r.expense_type === 'deposit')
    if (tab === 'expense') list = list.filter(r => r.expense_type === 'expense')
    if (search.trim())     list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    if (catFilter)         list = list.filter(r => r.category_name === catFilter)
    if (freqFilter)        list = list.filter(r => r.frequency === freqFilter)
    return list
  }, [items, tab, search, catFilter, freqFilter])

  const stats = useMemo(() => {
    const expenses = items.filter(r => r.expense_type === 'expense')
    const income   = items.filter(r => r.expense_type === 'deposit')
    const active   = items.filter(r => activeStates[r.expense_id])
    const paused   = items.filter(r => !activeStates[r.expense_id])
    const monthlyBills  = expenses.reduce((s, r) => s + (r.amount || 0), 0)
    const monthlyIncome = income.reduce((s, r) => s + (r.amount || 0), 0)
    const dueThisWeek   = items.filter(r => isDueSoon(nextOccurrence(r.purchase_date, r.frequency))).length
    return { monthlyBills, monthlyIncome, active: active.length, paused: paused.length, dueThisWeek }
  }, [items, activeStates])

  const tabCounts = useMemo(() => ({
    all:     items.length,
    income:  items.filter(r => r.expense_type === 'deposit').length,
    expense: items.filter(r => r.expense_type === 'expense').length,
  }), [items])

  const dueSoon = useMemo(() =>
    items
      .map(r => ({ ...r, nextDate: nextOccurrence(r.purchase_date, r.frequency) }))
      .filter(r => isDueSoon(r.nextDate))
      .sort((a, b) => a.nextDate - b.nextDate)
      .slice(0, 5),
    [items]
  )

  /* stable category color map */
  const catColorMap = useMemo(() => {
    const map = {}
    CATEGORIES.forEach((cat, i) => { map[cat] = CAT_COLORS[i % CAT_COLORS.length] })
    return map
  }, [CATEGORIES])

  const mainNav = [
    { id: 'dashboard',    label: 'Dashboard',    icon: 'grid',   path: '/dashboard'  },
    { id: 'transactions', label: 'Transactions', icon: 'dollar', path: '/transactions'},
    { id: 'recurring',    label: 'Recurring',    icon: 'users',  path: '/recurring'  },
    { id: 'upload',       label: 'Upload',       icon: 'upload', path: '/upload'     },
  ]
  const financeNav = [
    { id: 'accounts', label: 'Accounts', icon: 'card',     path: '/accounts' },
    { id: 'spending', label: 'Spending', icon: 'activity', path: '/spending'  },
  ]

  return (
    <div className="dash-wrap">

      {/* Navbar */}
      <header className="dash-nav">
        <Link to="/" className="dash-brand">Panther Ledger</Link>
        <div className="dash-nav-right">
          <button className="dash-icon-btn"><Icon name="bell" /></button>
          <button className="dash-icon-btn"><Icon name="search" /></button>
          <div className="dash-avatar" title="Log out" onClick={logout} style={{ cursor: 'pointer' }}>
            {userInitials}
          </div>
        </div>
      </header>

      <div className="dash-body">

        {/* Sidebar */}
        <aside className="dash-sidebar">
          <p className="sidebar-section-label">Main</p>
          {mainNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${item.id === 'recurring' ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
          <p className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Finance</p>
          {financeNav.map(item => (
            <button key={item.id} className="sidebar-item" onClick={() => navigate(item.path)}>
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="dash-main" onClick={() => setOpenDrop(null)}>

          <div className="rc-page-header">
            <h1 className="rc-title">Recurring</h1>
            <button className="rc-add-btn">
              <Icon name="plus" size={15} />
              Add Recurring
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading your recurring items…</p>
          ) : (
            <>
              {/* Stat cards */}
              <div className="rc-stats">
                <div className="rc-stat-card">
                  <p className="rc-stat-label">MONTHLY BILLS</p>
                  <p className="rc-stat-value red">-${stats.monthlyBills.toFixed(2)}</p>
                </div>
                <div className="rc-stat-card">
                  <p className="rc-stat-label">MONTHLY INCOME</p>
                  <p className="rc-stat-value green">+${stats.monthlyIncome.toFixed(2)}</p>
                </div>
                <div className="rc-stat-card">
                  <p className="rc-stat-label">ACTIVE</p>
                  <p className="rc-stat-value dark">{stats.active}</p>
                </div>
                <div className="rc-stat-card">
                  <p className="rc-stat-label">PAUSED</p>
                  <p className="rc-stat-value dark">{stats.paused}</p>
                </div>
                <div className="rc-stat-card">
                  <p className="rc-stat-label">DUE THIS WEEK</p>
                  <p className="rc-stat-value gold">{stats.dueThisWeek}</p>
                </div>
              </div>

              {/* Content grid */}
              <div className="rc-content-grid">

                {/* Left: filter + list */}
                <div className="rc-list-col">

                  {/* Filter bar */}
                  <div className="rc-filter-bar" onClick={e => e.stopPropagation()}>
                    <div className="rc-search-wrap">
                      <Icon name="search" size={14} />
                      <input
                        className="rc-search-input"
                        placeholder="Search recurring..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>

                    <div className="rc-drop-wrap">
                      <button
                        className={`rc-filter-btn ${openDrop === 'cat' ? 'open' : ''} ${catFilter ? 'active' : ''}`}
                        onClick={() => setOpenDrop(o => o === 'cat' ? null : 'cat')}
                      >
                        <Icon name="repeat" size={13} /> Category <Icon name="chevron-down" size={13} />
                      </button>
                      {openDrop === 'cat' && (
                        <div className="rc-dropdown">
                          <button className={`rc-drop-item ${!catFilter ? 'selected' : ''}`} onClick={() => { setCatFilter(''); setOpenDrop(null) }}>All categories</button>
                          {CATEGORIES.map(cat => (
                            <button key={cat} className={`rc-drop-item ${catFilter === cat ? 'selected' : ''}`} onClick={() => { setCatFilter(cat); setOpenDrop(null) }}>{cat}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rc-drop-wrap">
                      <button
                        className={`rc-filter-btn ${openDrop === 'freq' ? 'open' : ''} ${freqFilter ? 'active' : ''}`}
                        onClick={() => setOpenDrop(o => o === 'freq' ? null : 'freq')}
                      >
                        <Icon name="repeat" size={13} /> Frequency <Icon name="chevron-down" size={13} />
                      </button>
                      {openDrop === 'freq' && (
                        <div className="rc-dropdown">
                          <button className={`rc-drop-item ${!freqFilter ? 'selected' : ''}`} onClick={() => { setFreqFilter(''); setOpenDrop(null) }}>All frequencies</button>
                          {FREQUENCIES.map(f => (
                            <button key={f} className={`rc-drop-item ${freqFilter === f ? 'selected' : ''}`} onClick={() => { setFreqFilter(f); setOpenDrop(null) }}>{f}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="rc-tabs">
                    {[
                      { key: 'all',     label: `All (${tabCounts.all})`           },
                      { key: 'expense', label: `Expenses (${tabCounts.expense})`  },
                      { key: 'income',  label: `Income (${tabCounts.income})`     },
                    ].map(t => (
                      <button key={t.key} className={`rc-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Item list */}
                  <div className="rc-item-list">
                    {filtered.length === 0 ? (
                      <p className="rc-empty">
                        {items.length === 0 ? 'No recurring items yet. Add one to get started.' : 'No items match your filters.'}
                      </p>
                    ) : filtered.map((item, idx) => {
                      const isActive  = activeStates[item.expense_id]
                      const isIncome  = item.expense_type === 'deposit'
                      const palette   = AVATAR_PALETTE[idx % AVATAR_PALETTE.length]
                      const catStyle  = catColorMap[item.category_name] || CAT_COLORS[0]
                      const initials  = (item.name || '??').slice(0, 2).toUpperCase()
                      const nextDate  = nextOccurrence(item.purchase_date, item.frequency)
                      const urgent    = isDueSoon(nextDate)
                      return (
                        <div key={item.expense_id} className={`rc-item-card ${!isActive ? 'paused' : ''}`}>
                          <div className="rc-item-avatar" style={{ background: palette.bg, color: palette.color }}>
                            {initials}
                          </div>
                          <div className="rc-item-body">
                            <div className="rc-item-top">
                              <span className="rc-item-name" style={{ textTransform: 'capitalize' }}>{item.name}</span>
                              <span className="rc-item-cat-badge" style={{ color: catStyle.color, background: catStyle.bg }}>
                                {item.category_name || 'Uncategorized'}
                              </span>
                            </div>
                            <p className="rc-item-desc">{item.description || item.frequency}</p>
                            <div className="rc-item-meta">
                              <span className="rc-item-next">
                                NEXT <strong className={urgent ? 'urgent' : ''}>{fmtShort(nextDate)}</strong>
                              </span>
                              <span className="rc-freq-pill">{item.frequency || '—'}</span>
                            </div>
                          </div>
                          <div className="rc-item-right">
                            <span className={`rc-item-amount ${isIncome ? 'green' : 'red'}`}>
                              {isIncome ? '+' : '-'}${Number(item.amount).toFixed(2)}
                            </span>
                            <Toggle checked={!!isActive} onChange={() => toggleItem(item.expense_id)} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right: calendar + due soon */}
                <div className="rc-right-col">
                  <Calendar items={items} />

                  <div className="rc-due-soon">
                    <p className="rc-due-soon-title">DUE SOON</p>
                    {dueSoon.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Nothing due in the next 7 days.</p>
                    ) : dueSoon.map(item => {
                      const isIncome = item.expense_type === 'deposit'
                      return (
                        <div key={item.expense_id} className="rc-due-row">
                          <div className="rc-due-info">
                            <span className="rc-due-name" style={{ textTransform: 'capitalize' }}>{item.name}</span>
                            <span className="rc-due-date">{fmtShort(item.nextDate)}</span>
                          </div>
                          <span className={`rc-due-amount ${isIncome ? 'green' : 'red'}`}>
                            {isIncome ? '+' : '-'}${Number(item.amount).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          <p className="dash-footer-text">Florida International University</p>
        </main>
      </div>

      <button className="chat-fab">
        <Icon name="chat" size={20} />
        <span className="chat-dot" />
      </button>
    </div>
  )
}

export default Recurring
