import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getSession } from '../../api'
import { AppLayout, Icon } from '../../components'
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

/* ── Interactive spend chart ── */
const DASH_X_MIN = 5, DASH_X_MAX = 248, DASH_Y_TOP = 16, DASH_Y_BOTTOM = 68
const DASH_VB_W = 253, DASH_VB_H = 76

function SpendChart({ thisChart, lastChart, chartMax }) {
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)

  const days = thisChart.daysInMonth

  function dayToX(day, totalDays) {
    return DASH_X_MIN + (day / totalDays) * (DASH_X_MAX - DASH_X_MIN)
  }
  function valToY(val) {
    const safe = chartMax || 1
    return DASH_Y_BOTTOM - (val / safe) * (DASH_Y_BOTTOM - DASH_Y_TOP)
  }
  function buildPath(cumData, totalDays, upTo) {
    const limit = upTo !== undefined ? Math.min(upTo, totalDays) : totalDays
    const pts = []
    for (let i = 0; i <= limit; i++) {
      pts.push([+dayToX(i, totalDays).toFixed(1), +valToY(cumData[i] || 0).toFixed(1)])
    }
    if (pts.length < 2) return { line: '', area: '', dot: null }
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ')
    const last = pts[pts.length - 1]
    const area = `${line} L ${last[0]},${DASH_Y_BOTTOM} L ${pts[0][0]},${DASH_Y_BOTTOM} Z`
    return { line, area, dot: last }
  }

  const today = new Date().getDate()
  const thisPts = buildPath(thisChart.cumDaily, days, today)
  const lastPts = buildPath(lastChart.cumDaily, lastChart.daysInMonth)

  function handleMouseMove(e) {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) / rect.width * DASH_VB_W
    const day = Math.round(((svgX - DASH_X_MIN) / (DASH_X_MAX - DASH_X_MIN)) * days)
    setHover(Math.max(0, Math.min(day, Math.min(today, days))))
  }

  const hoverThisVal = hover !== null ? (thisChart.cumDaily[hover] || 0) : null
  const hoverLastVal = hover !== null ? (lastChart.cumDaily[Math.min(hover, lastChart.daysInMonth)] || 0) : null
  const hoverX       = hover !== null ? dayToX(hover, days) : null

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        className="spend-chart"
        viewBox={`0 0 ${DASH_VB_W} ${DASH_VB_H}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        style={{ cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#081E3F" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#081E3F" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {lastPts.line && <path d={lastPts.line} fill="none" stroke="#B5934C" strokeWidth="1.5" strokeDasharray="5 3" />}
        {thisPts.line && <path d={thisPts.area} fill="url(#dashAreaGrad)" />}
        {thisPts.line && <path d={thisPts.line} fill="none" stroke="#081E3F" strokeWidth="2" />}
        {thisPts.dot && <circle cx={thisPts.dot[0]} cy={thisPts.dot[1]} r="3.5" fill="#081E3F" stroke="#fff" strokeWidth="1.5" />}
        {hover !== null && (
          <>
            <line x1={hoverX} x2={hoverX} y1={DASH_Y_TOP} y2={DASH_Y_BOTTOM} stroke="#081E3F" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
            <circle cx={hoverX} cy={valToY(hoverThisVal)} r="4" fill="#081E3F" stroke="#fff" strokeWidth="2" />
            <circle cx={hoverX} cy={valToY(hoverLastVal)} r="3.5" fill="#B5934C" stroke="#fff" strokeWidth="1.5" />
          </>
        )}
        <rect x={DASH_X_MIN} y={DASH_Y_TOP} width={DASH_X_MAX - DASH_X_MIN} height={DASH_Y_BOTTOM - DASH_Y_TOP} fill="transparent" />
      </svg>
      {hover !== null && (
        <div className="dash-chart-tooltip">
          <p className="dash-tooltip-day">Day {hover}</p>
          <div className="dash-tooltip-row">
            <span className="dash-tooltip-dot" style={{ background: '#081E3F' }} />
            <span>This month: <strong>${hoverThisVal.toFixed(2)}</strong></span>
          </div>
          <div className="dash-tooltip-row">
            <span className="dash-tooltip-dot" style={{ background: '#B5934C' }} />
            <span>Last month: <strong>${hoverLastVal.toFixed(2)}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
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
  const cx = 100, cy = 100, outerR = 84, innerR = 50
  let angle = -Math.PI / 2
  const [hovered, setHovered] = useState(null)

  if (slices.length === 0) {
    return (
      <svg viewBox="0 0 200 200" style={{ width: 200, height: 200 }}>
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
    <svg viewBox="0 0 200 200" style={{ width: 200, height: 200, overflow: 'visible' }}>
      {paths}
      <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
      {activeSlice ? (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize="10" fill="#6b7280" style={{ textTransform: 'uppercase' }}>
            {activeSlice.label.length > 10 ? activeSlice.label.slice(0, 10) + '…' : activeSlice.label}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">
            ${activeSlice.amount}
          </text>
          <text x={cx} y={cy + 22} textAnchor="middle" fontSize="11" fill="#9ca3af">
            {Math.round(activeSlice.pct * 100)}%
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">TOTAL</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="17" fontWeight="700" fill="#111827">
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

  const pieData = buildPieData(expenses)
  const pieTotal = pieData.reduce((s, c) => s + c.amount, 0)

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear
  const thisChart  = buildDailyChart(expenses, thisYear, thisMonth)
  const lastChart  = buildDailyChart(expenses, lastYear, lastMonth)
  const chartMax   = Math.max(thisChart.total, lastChart.total, 1)

  const recentTx = [...expenses]
    .sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''))
    .slice(0, 5)

  const totalSpend = analytics ? `$${analytics.total_expenses.toLocaleString()}` : '—'
  const firstName = session?.first_name || session?.username || 'there'

  return (
    <AppLayout activeNav="dashboard">
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
                    <button className="card-link-btn" onClick={() => navigate('/spending')}>
                      <Icon name="arrow-right" size={16} />
                    </button>
                  </div>
                  <p className="spend-amount">{totalSpend}</p>
                  {analytics && (
                    <p className="spend-trend">
                      Net: {analytics.net >= 0 ? '+' : ''}${analytics.net.toLocaleString()} · {analytics.count} transactions
                    </p>
                  )}

                  <SpendChart thisChart={thisChart} lastChart={lastChart} chartMax={chartMax} />

                  <div className="chart-x-labels">
                    <span>1st</span><span>8th</span><span>16th</span><span>24th</span>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-line solid" />This Month</span>
                    <span className="legend-item"><span className="legend-line dashed" />Last Month</span>
                  </div>
                </div>

                {/* Card 2 — Category Pie */}
                <div className="card dash-pie-card">
                  <div className="card-header-row">
                    <p className="card-eyebrow">Spending by Category</p>
                     <button className="card-link-btn" onClick={() => navigate('/spending')}>
                      <Icon name="arrow-right" size={16} />
                    </button>
                  </div>
                  {pieData.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>No expenses this month.</p>
                  ) : (
                    <div className="dash-pie-body">
                      <PieChart slices={pieData} total={pieTotal} />
                      <div className="dash-pie-legend">
                        {pieData.map((s, i) => (
                          <div key={i} className="dash-pie-legend-row">
                            <span className="dash-pie-legend-dot" style={{ background: s.color }} />
                            <span className="dash-pie-legend-label">{s.label}</span>
                            <span className="dash-pie-legend-pct">{Math.round(s.pct * 100)}%</span>
                            <span className="dash-pie-legend-amt">${s.amount}</span>
                          </div>
                        ))}
                      </div>
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
    </AppLayout>
  )
}

export default Dashboard
