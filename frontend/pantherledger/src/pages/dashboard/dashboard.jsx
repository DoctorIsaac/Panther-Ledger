import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getSession } from '../../api'
import { AppLayout, Icon } from '../../components'
import './dashboard.css'

/* ── Monthly net cash flow helpers ── */
function buildMonthlyNetFlow(expenses) {
  const months = {}
  for (const e of expenses) {
    if (!e.purchase_date) continue
    const d = new Date(e.purchase_date + 'T00:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!months[key]) months[key] = { deposits: 0, expenses: 0 }
    if (e.expense_type === 'deposit') months[key].deposits += e.amount || 0
    else months[key].expenses += e.amount || 0
  }
  return Object.keys(months).sort().slice(-6).map(key => {
    const [year, month] = key.split('-').map(Number)
    const net = months[key].deposits - months[key].expenses
    const label = new Date(year, month - 1, 1)
      .toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    return { key, label, net }
  })
}

/* ── Net cash flow bar chart ── */
function NetCashFlowChart({ data }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>No transaction data yet.</p>
  }

  const VB_W = 420, VB_H = 180
  const ML = 52, MR = 12, MT = 10, MB = 28
  const plotH = VB_H - MT - MB
  const plotW = VB_W - ML - MR

  const maxAbs = Math.max(...data.map(d => Math.abs(d.net)), 1)
  const scale  = Math.ceil(maxAbs / 100) * 100

  const zeroY  = MT + plotH / 2
  const yOf    = val => MT + plotH / 2 - (val / scale) * (plotH / 2)
  const ticks  = [-scale, -scale / 2, 0, scale / 2, scale]

  const barGap = plotW / data.length
  const barW   = barGap * 0.55

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', display: 'block' }}>
      {/* Grid lines */}
      {ticks.map((v, i) => (
        <line key={i}
          x1={ML} x2={VB_W - MR} y1={yOf(v)} y2={yOf(v)}
          stroke={v === 0 ? '#d1d5db' : '#f3f4f6'}
          strokeWidth={v === 0 ? 1 : 0.75}
        />
      ))}

      {/* Y-axis labels */}
      {ticks.map((v, i) => (
        <text key={i} x={ML - 6} y={yOf(v) + 4}
          textAnchor="end" fontSize="9.5" fill="#9ca3af">
          {v === 0 ? '$0' : v > 0 ? `$${v}` : `-$${Math.abs(v)}`}
        </text>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const cx   = ML + (i + 0.5) * barGap
        const barH = Math.max(Math.abs((d.net / scale) * (plotH / 2)), 1)
        const y    = d.net >= 0 ? yOf(d.net) : zeroY
        return (
          <rect key={i}
            x={cx - barW / 2} y={y} width={barW} height={barH}
            fill={d.net >= 0 ? '#22c55e' : '#ef4444'}
            opacity={hovered === i ? 1 : 0.82}
            rx={2}
            style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        )
      })}

      {/* Hover value label */}
      {hovered !== null && (() => {
        const d  = data[hovered]
        const cx = ML + (hovered + 0.5) * barGap
        return (
          <text x={cx} y={Math.max(yOf(d.net) - 5, MT + 10)}
            textAnchor="middle" fontSize="10" fontWeight="600"
            fill={d.net >= 0 ? '#16a34a' : '#dc2626'}>
            {d.net >= 0 ? '+' : '-'}${Math.abs(d.net).toFixed(0)}
          </text>
        )
      })()}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text key={i} x={ML + (i + 0.5) * barGap} y={VB_H - MB + 16}
          textAnchor="middle" fontSize="9.5" fill="#6b7280">
          {d.label}
        </text>
      ))}
    </svg>
  )
}

/* ── Greeting ── */
const morning = ['Good morning', 'Rise & shine!', 'Top of the morning!', 'Early bird! Love the energy.']
const afternoon = ['Good afternoon', 'Afternoon!', 'Welcome back!', 'Hey, glad you stopped by']
const evening = ['Good evening', 'Evening!', 'Wrapping up the day?', 'Still at it — respect.']

export const getGreeting = () => {
  const h = new Date().getHours()
  let list = morning
  if (h >= 12 && h < 17) list = afternoon
  else if (h >= 17) list = evening
  const index = new Date().getSeconds() % list.length
  return list[index]
}

/* ── Peppy insight ── */
function getInsight(analytics, pieData, monthlyNetFlow) {
  const expenses = analytics?.total_expenses || 0
  const deposits = analytics?.total_deposits || 0
  const net = deposits - expenses

  if (expenses === 0 && deposits === 0) {
    return "No transactions yet this month. Upload a bank statement and I'll get to work! 📂"
  }

  const topCat = pieData[0]
  if (topCat && topCat.pct > 0.5) {
    return `Over half your spending went to "${topCat.label}" this month. Worth a closer look? 🔍`
  }

  if (net > 0) {
    return `You're ahead by $${net.toFixed(2)} this month. Saving streak — keep it going! 🚀`
  }

  if (net < 0 && Math.abs(net) < expenses * 0.1) {
    return `Almost balanced! You're only $${Math.abs(net).toFixed(2)} in the red. So close! 💪`
  }

  if (net < -500) {
    return `Spending outpaced income by $${Math.abs(net).toFixed(2)} this month. Let's see where it went. 👀`
  }

  if (monthlyNetFlow.length >= 2) {
    const last = monthlyNetFlow[monthlyNetFlow.length - 1]
    const prev = monthlyNetFlow[monthlyNetFlow.length - 2]
    if (last && prev && last.net > prev.net) {
      return `Net cash flow improved from last month. You're trending in the right direction! 📈`
    }
  }

  return `You've got ${pieData.length} spending categories tracked. Knowledge is power! 🧠`
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

  const pieData        = buildPieData(expenses)
  const pieTotal       = pieData.reduce((s, c) => s + c.amount, 0)
  const monthlyNetFlow = buildMonthlyNetFlow(expenses)

  const recentTx = [...expenses]
    .sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''))
    .slice(0, 5)

  const firstName = session?.first_name || session?.username || 'there'
  const totalExpenses = analytics?.total_expenses || 0
  const totalDeposits = analytics?.total_deposits || 0
  const netThisMonth  = totalDeposits - totalExpenses
  const monthLabel    = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const insight       = getInsight(analytics, pieData, monthlyNetFlow)

  return (
    <AppLayout activeNav="dashboard">

      {/* ── Hero banner ── */}
      <div className="dash-hero">
        <span className="dash-hero-ring dash-hero-ring-1" />
        <span className="dash-hero-ring dash-hero-ring-2" />

        <div className="dash-hero-left">
          <p className="dash-hero-eyebrow">{monthLabel}</p>
          <h1 className="dash-hero-greeting">
            {getGreeting()}, <span className="dash-hero-name">{firstName}</span> 👋
          </h1>
          <p className="dash-hero-sub">Here's your financial snapshot for today.</p>
        </div>

        <div className="dash-hero-metrics">
          <div className="dash-hero-metric">
            <span className="dash-hero-metric-label">EXPENSES</span>
            <span className="dash-hero-metric-val dash-hero-red">
              -${totalExpenses.toFixed(2)}
            </span>
          </div>
          <span className="dash-hero-sep" />
          <div className="dash-hero-metric">
            <span className="dash-hero-metric-label">INCOME</span>
            <span className="dash-hero-metric-val dash-hero-green">
              +${totalDeposits.toFixed(2)}
            </span>
          </div>
          <span className="dash-hero-sep" />
          <div className="dash-hero-metric">
            <span className="dash-hero-metric-label">NET</span>
            <span className={`dash-hero-metric-val ${netThisMonth >= 0 ? 'dash-hero-green' : 'dash-hero-red'}`}>
              {netThisMonth >= 0 ? '+' : '-'}${Math.abs(netThisMonth).toFixed(2)}
            </span>
          </div>
          <span className="dash-hero-sep" />
          <div className="dash-hero-metric">
            <span className="dash-hero-metric-label">TRANSACTIONS</span>
            <span className="dash-hero-metric-val dash-hero-white">{expenses.length}</span>
          </div>
        </div>
      </div>

      {/* ── Peppy insight strip ── */}
      <div className="dash-insight">
        <span className="dash-insight-avatar">🐾</span>
        <div>
          <p className="dash-insight-label">PEPPY SAYS</p>
          <p className="dash-insight-text">{insight}</p>
        </div>
      </div>

      {loadingData ? (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading your data…</p>
          ) : (
            <>
              {/* Top 2-col cards */}
              <div className="cards-top">

                {/* Card 1 — Net Cash Flow */}
                <div className="card">
                  <div className="card-header-row">
                    <p className="card-eyebrow">Net Cash Flow by Month</p>
                    <button className="card-link-btn" onClick={() => navigate('/spending')}>
                      <Icon name="arrow-right" size={16} />
                    </button>
                  </div>
                  <NetCashFlowChart data={monthlyNetFlow} />
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
