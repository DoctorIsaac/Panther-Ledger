import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getSession } from '../../api'
import { AppLayout, Icon } from '../../components'
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

/* ── Toggle switch ── */
const Toggle = ({ checked, onChange }) => (
  <button className={`rc-toggle ${checked ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={checked} />
)

/* ── Recurring Page ── */
const Recurring = () => {
  const navigate = useNavigate()
  const session = getSession()

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

  return (
    <AppLayout activeNav="recurring">
      <div onClick={() => setOpenDrop(null)}>

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

                {/* Left: calendar + due soon (main focus) */}
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

                {/* Right: filter + list */}
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
                        {items.length === 0 ? 'No recurring items yet. Once Peppy sees the same charge across five statements, it will appear here.' : 'No items match your filters.'}
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
              </div>
            </>
          )}

          <p className="dash-footer-text">Florida International University</p>
      </div>
    </AppLayout>
  )
}

export default Recurring
