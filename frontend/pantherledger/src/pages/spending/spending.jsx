import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getSession, clearSession } from '../../api'
import '../dashboard/dashboard.css'
import './spending.css'

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
    case 'logout':       return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'upload':       return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    case 'chat':         return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'chevron-left': return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="15 18 9 12 15 6"/></svg>
    case 'chevron-right':return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="9 18 15 12 9 6"/></svg>
    case 'x':            return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    default:             return null
  }
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CAT_COLORS  = ['#081E3F','#B5934C','#3b82f6','#22c55e','#ef4444','#a855f7','#f97316','#06b6d4','#ec4899','#84cc16']

/* ── Data helpers ── */
function buildDaily(expenses, year, month) {
  const days = new Date(year, month + 1, 0).getDate()
  const daily = new Array(days + 1).fill(0)
  for (const e of expenses) {
    if (e.expense_type !== 'expense' || !e.purchase_date) continue
    const d = new Date(e.purchase_date + 'T00:00:00')
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    daily[d.getDate()] += e.amount || 0
  }
  return { daily, days }
}

function buildCumulative(daily) {
  const cum = []; let t = 0
  for (const v of daily) { t += v; cum.push(t) }
  return cum
}

function buildCategoryData(expenses, year, month) {
  const totals = {}
  for (const e of expenses) {
    if (e.expense_type !== 'expense' || !e.purchase_date) continue
    const d = new Date(e.purchase_date + 'T00:00:00')
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    const cat = e.category_name || 'Other'
    totals[cat] = (totals[cat] || 0) + (e.amount || 0)
  }
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const total   = entries.reduce((s, [, v]) => s + v, 0) || 1
  return entries.map(([label, amount], i) => ({
    label, amount: Math.round(amount * 100) / 100,
    pct: amount / total,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))
}

function topTxForCategory(expenses, year, month, categoryLabel, limit = 3) {
  return expenses
    .filter(e => {
      if (e.expense_type !== 'expense' || !e.purchase_date) return false
      const d = new Date(e.purchase_date + 'T00:00:00')
      if (d.getFullYear() !== year || d.getMonth() !== month) return false
      return (e.category_name || 'Other') === categoryLabel
    })
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, limit)
}

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`
}

/* ── Interactive line chart ── */
const X_MIN = 52, X_MAX = 580, Y_TOP = 20, Y_BOTTOM = 130
const VB_W = 600, VB_H = 155

function dayToX(day, totalDays) {
  return X_MIN + (day / totalDays) * (X_MAX - X_MIN)
}
function valToY(val, maxVal) {
  const safe = maxVal || 1
  return Y_BOTTOM - (val / safe) * (Y_BOTTOM - Y_TOP)
}

function LineChart({ thisCum, lastCum, thisDays, lastDays, thisLabel, lastLabel, maxVal, upToDay }) {
  const svgRef  = useRef(null)
  const [hover, setHover] = useState(null)

  const thisPoints = useMemo(() => {
    const limit = Math.min(upToDay ?? thisDays, thisDays)
    return Array.from({ length: limit + 1 }, (_, i) => [
      dayToX(i, thisDays),
      valToY(thisCum[i] || 0, maxVal),
    ])
  }, [thisCum, thisDays, maxVal, upToDay])

  const lastPoints = useMemo(() => (
    Array.from({ length: lastDays + 1 }, (_, i) => [
      dayToX(i, lastDays),
      valToY(lastCum[i] || 0, maxVal),
    ])
  ), [lastCum, lastDays, maxVal])

  const toPath = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const toArea = (pts, days) => {
    if (pts.length < 2) return ''
    const last = pts[pts.length - 1]
    return `${toPath(pts)} L ${last[0].toFixed(1)},${Y_BOTTOM} L ${dayToX(0, days).toFixed(1)},${Y_BOTTOM} Z`
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: valToY(maxVal * f, maxVal),
    label: `$${Math.round(maxVal * f).toLocaleString()}`,
  }))

  const xLabels = [1, Math.floor(thisDays / 3), Math.floor(2 * thisDays / 3), thisDays].map(d => ({
    x: dayToX(d, thisDays),
    label: `${d}`,
  }))

  function handleMouseMove(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const svgX  = (e.clientX - rect.left) / rect.width * VB_W
    const day   = Math.round(((svgX - X_MIN) / (X_MAX - X_MIN)) * thisDays)
    const clamp = Math.max(0, Math.min(day, Math.min(upToDay ?? thisDays, thisDays)))
    setHover(clamp)
  }

  const hoverThisVal = hover !== null ? (thisCum[hover] || 0) : null
  const hoverLastVal = hover !== null ? (lastCum[Math.min(hover, lastDays)] || 0) : null
  const hoverX       = hover !== null ? dayToX(hover, thisDays) : null

  return (
    <div className="sp-chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="sp-line-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#081E3F" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#081E3F" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={X_MIN} x2={X_MAX} y1={t.y} y2={t.y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={X_MIN - 6} y={t.y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{t.label}</text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={VB_H - 2} textAnchor="middle" fontSize="9" fill="#9ca3af">{l.label}</text>
        ))}

        {/* Last month (dashed) */}
        {lastPoints.length > 1 && (
          <path d={toPath(lastPoints)} fill="none" stroke="#B5934C" strokeWidth="1.5" strokeDasharray="5 3" />
        )}

        {/* This month area + line */}
        {thisPoints.length > 1 && (
          <>
            <path d={toArea(thisPoints, thisDays)} fill="url(#spGrad)" />
            <path d={toPath(thisPoints)} fill="none" stroke="#081E3F" strokeWidth="2.5" />
            <circle
              cx={thisPoints[thisPoints.length - 1][0]}
              cy={thisPoints[thisPoints.length - 1][1]}
              r="4" fill="#081E3F" stroke="#fff" strokeWidth="2"
            />
          </>
        )}

        {/* Hover vertical line */}
        {hover !== null && (
          <>
            <line
              x1={hoverX} x2={hoverX} y1={Y_TOP} y2={Y_BOTTOM}
              stroke="#081E3F" strokeWidth="1" strokeDasharray="3 2" opacity="0.4"
            />
            <circle cx={hoverX} cy={valToY(hoverThisVal, maxVal)} r="5" fill="#081E3F" stroke="#fff" strokeWidth="2" />
            {lastCum.length > 0 && (
              <circle cx={hoverX} cy={valToY(hoverLastVal, maxVal)} r="4" fill="#B5934C" stroke="#fff" strokeWidth="2" />
            )}
          </>
        )}

        {/* Transparent hover overlay */}
        <rect x={X_MIN} y={Y_TOP} width={X_MAX - X_MIN} height={Y_BOTTOM - Y_TOP} fill="transparent" />
      </svg>

      {/* Hover tooltip */}
      {hover !== null && (
        <div className="sp-tooltip">
          <p className="sp-tooltip-day">Day {hover}</p>
          <p className="sp-tooltip-row" style={{ color: '#081E3F' }}>
            <span className="sp-tooltip-dot" style={{ background: '#081E3F' }} />
            {thisLabel}: <strong>${hoverThisVal.toFixed(2)}</strong>
          </p>
          {lastCum.length > 0 && (
            <p className="sp-tooltip-row" style={{ color: '#B5934C' }}>
              <span className="sp-tooltip-dot" style={{ background: '#B5934C' }} />
              {lastLabel}: <strong>${hoverLastVal.toFixed(2)}</strong>
            </p>
          )}
        </div>
      )}

      <div className="sp-legend">
        <span className="sp-legend-item">
          <span className="sp-legend-line solid" />{thisLabel}
        </span>
        <span className="sp-legend-item">
          <span className="sp-legend-line dashed" />{lastLabel}
        </span>
      </div>
    </div>
  )
}

/* ── Daily bar chart ── */
function DailyBarChart({ daily, days, maxVal }) {
  const [hover, setHover] = useState(null)
  const barW = Math.max(2, Math.floor(540 / days) - 1)

  return (
    <div className="sp-chart-wrap">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="sp-line-svg">
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1
          const val = daily[day] || 0
          const barH = maxVal ? (val / maxVal) * (Y_BOTTOM - Y_TOP) : 0
          const x = dayToX(day - 0.5, days)
          return (
            <g key={day}
              onMouseEnter={() => setHover({ day, val })}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={x - barW / 2} y={Y_BOTTOM - barH}
                width={barW} height={barH}
                fill={hover?.day === day ? '#B5934C' : '#081E3F'}
                rx="2"
                style={{ transition: 'fill 0.15s' }}
              />
            </g>
          )
        })}
        {[0, 0.5, 1].map((f, i) => (
          <g key={i}>
            <line x1={X_MIN} x2={X_MAX} y1={valToY(maxVal * f, maxVal)} y2={valToY(maxVal * f, maxVal)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={X_MIN - 6} y={valToY(maxVal * f, maxVal) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              ${Math.round(maxVal * f).toLocaleString()}
            </text>
          </g>
        ))}
      </svg>
      {hover && (
        <div className="sp-tooltip">
          <p className="sp-tooltip-day">Day {hover.day}</p>
          <p className="sp-tooltip-row" style={{ color: '#081E3F' }}>
            <span className="sp-tooltip-dot" style={{ background: '#B5934C' }} />
            Spent: <strong>${hover.val.toFixed(2)}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Donut chart ── */
function Donut({ slices, total, selected, onSelect }) {
  const cx = 115, cy = 115, outerR = 96, innerR = 58
  const [hovered, setHovered] = useState(null)
  let angle = -Math.PI / 2

  if (slices.length === 0) return (
    <svg viewBox="0 0 230 230" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={outerR} fill="#f3f4f6" />
      <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="#9ca3af">No data</text>
    </svg>
  )

  const paths = slices.map((slice, i) => {
    const start = angle
    const sweep = slice.pct * 2 * Math.PI
    angle += sweep
    const end = angle
    const large = sweep > Math.PI ? 1 : 0
    const active = hovered === i || selected === slice.label
    const or = active ? outerR + 6 : outerR
    const ox1 = cx + or * Math.cos(start), oy1 = cy + or * Math.sin(start)
    const ox2 = cx + or * Math.cos(end),   oy2 = cy + or * Math.sin(end)
    const ix1 = cx + innerR * Math.cos(start), iy1 = cy + innerR * Math.sin(start)
    const ix2 = cx + innerR * Math.cos(end),   iy2 = cy + innerR * Math.sin(end)
    return (
      <path
        key={i}
        d={`M ${ox1} ${oy1} A ${or} ${or} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`}
        fill={slice.color}
        opacity={selected && selected !== slice.label ? 0.35 : 1}
        style={{ cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onSelect(selected === slice.label ? null : slice.label)}
      />
    )
  })

  const active = hovered !== null ? slices[hovered] : selected ? slices.find(s => s.label === selected) : null

  return (
    <svg viewBox="0 0 230 230" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {paths}
      <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
      {active ? (
        <>
          <text x={cx} y={cy - 13} textAnchor="middle" fontSize="10" fill="#6b7280">
            {active.label.length > 13 ? active.label.slice(0, 13) + '…' : active.label}
          </text>
          <text x={cx} y={cy + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#111827">
            ${active.amount.toLocaleString()}
          </text>
          <text x={cx} y={cy + 23} textAnchor="middle" fontSize="11" fill="#9ca3af">
            {Math.round(active.pct * 100)}%
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#6b7280">TOTAL</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="17" fontWeight="700" fill="#111827">
            ${total.toLocaleString()}
          </text>
        </>
      )}
    </svg>
  )
}

/* ── Sankey chart ── */
function SankeyChart({ catData, totalExpenses }) {
  const [hov, setHov] = useState(null)

  const W = 640, H = 300
  const nodeW = 14
  const lx = 118, rx = W - 128
  const marginT = 14
  const availH = H - marginT * 2
  const gap = 8

  if (catData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#9ca3af', fontSize: '0.9rem' }}>
        No spending data for this month.
      </div>
    )
  }

  // Scale by total expenses so categories fill the chart proportionally.
  // Surplus is omitted — the stat cards already show it.
  const totalFlow = Math.max(totalExpenses, 1)
  const rightItems = [...catData]

  // Left (source) node fills full available height
  const srcH = availH
  const srcY = marginT

  // Right nodes stacked with gaps, centered vertically
  const totalNodeH = availH  // all nodes together = full height (no surplus node)
  const totalGapH  = gap * (rightItems.length - 1)
  let ry     = marginT + Math.max(0, (availH - totalNodeH - totalGapH) / 2)
  let srcOff = srcY

  const nodes = rightItems.map(item => {
    const nh = (item.amount / totalFlow) * availH
    const n  = { ...item, ny: ry, nh, sy1: srcOff, sy2: srcOff + nh }
    ry     += nh + gap
    srcOff += nh
    return n
  })

  const midX     = (lx + nodeW + rx) / 2
  const cap      = s => s.charAt(0).toUpperCase() + s.slice(1)
  const srcLabel  = 'Spending'
  const srcAmount = totalExpenses

  return (
    <div className="sp-chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="sp-sankey-svg"
        onMouseLeave={() => setHov(null)}
      >
        {/* Source node */}
        <rect x={lx} y={srcY} width={nodeW} height={srcH} fill="#081E3F" rx={3} />
        <text x={lx - 10} y={srcY + srcH / 2 - 8} textAnchor="end" dominantBaseline="middle" fontSize={11} fontWeight="700" fill="#1f2937">
          {srcLabel}
        </text>
        <text x={lx - 10} y={srcY + srcH / 2 + 8} textAnchor="end" dominantBaseline="middle" fontSize={9.5} fill="#9ca3af">
          ${srcAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </text>

        {nodes.map((n, i) => {
          const isHov  = hov === i
          const dimmed = hov !== null && !isHov
          const flowOp = dimmed ? 0.1 : 0.48
          const nodeOp = dimmed ? 0.28 : 1

          const path = [
            `M ${lx + nodeW} ${n.sy1}`,
            `C ${midX} ${n.sy1} ${midX} ${n.ny} ${rx} ${n.ny}`,
            `L ${rx} ${n.ny + n.nh}`,
            `C ${midX} ${n.ny + n.nh} ${midX} ${n.sy2} ${lx + nodeW} ${n.sy2}`,
            'Z',
          ].join(' ')

          const flowPct = Math.round((n.amount / totalFlow) * 100)

          return (
            <g key={n.label} onMouseEnter={() => setHov(i)} style={{ cursor: 'pointer' }}>
              <path d={path} fill={n.color} opacity={flowOp} style={{ transition: 'opacity 0.15s' }} />
              <rect x={rx} y={n.ny} width={nodeW} height={n.nh} fill={n.color} opacity={nodeOp} rx={3} style={{ transition: 'opacity 0.15s' }} />

              {/* Right labels */}
              <text
                x={rx + nodeW + 9}
                y={n.ny + n.nh / 2 - (n.nh >= 22 ? 7 : 0)}
                fontSize={10} fontWeight="600"
                fill={dimmed ? '#d1d5db' : '#1f2937'}
                dominantBaseline="middle"
                style={{ transition: 'fill 0.15s' }}
              >
                {cap(n.label)}
              </text>
              {n.nh >= 22 && (
                <text
                  x={rx + nodeW + 9} y={n.ny + n.nh / 2 + 8}
                  fontSize={9} fill={dimmed ? '#e5e7eb' : '#9ca3af'}
                  dominantBaseline="middle" style={{ transition: 'fill 0.15s' }}
                >
                  ${n.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} · {flowPct}%
                </text>
              )}

              {/* Hover label for tiny nodes */}
              {isHov && n.nh < 22 && (
                <text x={rx + nodeW + 9} y={n.ny + n.nh / 2 + 13} fontSize={9} fill="#9ca3af" dominantBaseline="middle">
                  ${n.amount.toFixed(2)} · {flowPct}%
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Hover tooltip */}
      {hov !== null && nodes[hov] && (
        <div className="sp-tooltip">
          <p className="sp-tooltip-day">{cap(nodes[hov].label)}</p>
          <p className="sp-tooltip-row">
            <span className="sp-tooltip-dot" style={{ background: nodes[hov].color }} />
            <strong>${nodes[hov].amount.toFixed(2)}</strong>
            &nbsp;<span style={{ color: '#9ca3af' }}>({Math.round((nodes[hov].amount / totalFlow) * 100)}% of {srcLabel.toLowerCase()})</span>
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Spending page ── */
const Spending = () => {
  const navigate  = useNavigate()
  const session   = getSession()
  const firstName = session?.first_name || session?.username || 'there'

  const [expenses,  setExpenses]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [pageTab,   setPageTab]   = useState('overview')   // 'overview' | 'cashflow'
  const [chartMode, setChartMode] = useState('cumulative') // 'cumulative' | 'daily'
  const [selected,  setSelected]  = useState(null)         // selected category

  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  useEffect(() => {
    if (!session) { navigate('/login'); return }
    api.get(`/expenses/${session.user_id}`)
      .then(exp => setExpenses(Array.isArray(exp) ? exp : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const prevMonthIdx  = month === 0 ? 11 : month - 1
  const prevMonthYear = month === 0 ? year - 1 : year
  const upToDay       = year === now.getFullYear() && month === now.getMonth() ? now.getDate() : undefined

  const { daily: thisDailyArr, days: thisDays } = useMemo(() => buildDaily(expenses, year, month), [expenses, year, month])
  const { daily: lastDailyArr, days: lastDays }  = useMemo(() => buildDaily(expenses, prevMonthYear, prevMonthIdx), [expenses, prevMonthYear, prevMonthIdx])
  const thisCum = useMemo(() => buildCumulative(thisDailyArr), [thisDailyArr])
  const lastCum = useMemo(() => buildCumulative(lastDailyArr), [lastDailyArr])
  const catData = useMemo(() => buildCategoryData(expenses, year, month), [expenses, year, month])

  const thisTotal   = thisCum[thisCum.length - 1] || 0
  const lastTotal   = lastCum[lastCum.length - 1] || 0
  const maxChartVal = Math.max(thisTotal, lastTotal, 1)
  const maxDailyVal = Math.max(...thisDailyArr, 1)

  const allDeposits = useMemo(() => {
    let s = 0
    for (const e of expenses) {
      if (e.expense_type !== 'deposit' || !e.purchase_date) continue
      const d = new Date(e.purchase_date + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) s += e.amount || 0
    }
    return s
  }, [expenses, year, month])

  const txCount = useMemo(() => expenses.filter(e => {
    if (!e.purchase_date) return false
    const d = new Date(e.purchase_date + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  }).length, [expenses, year, month])

  const activeDays = useMemo(() => thisDailyArr.filter(v => v > 0).length, [thisDailyArr])
  const avgPerDay  = activeDays ? thisTotal / activeDays : 0

  const filteredTx = useMemo(() => {
    return expenses.filter(e => {
      if (!e.purchase_date) return false
      const d = new Date(e.purchase_date + 'T00:00:00')
      if (d.getFullYear() !== year || d.getMonth() !== month) return false
      if (selected && e.category_name !== selected) return false
      return true
    }).sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''))
  }, [expenses, year, month, selected])

  const mainNav = [
    { id: 'dashboard',    label: 'Dashboard',    icon: 'grid',   path: '/dashboard'    },
    { id: 'transactions', label: 'Transactions', icon: 'dollar', path: '/transactions' },
    { id: 'recurring',    label: 'Recurring',    icon: 'users',  path: '/recurring'    },
    { id: 'upload',       label: 'Upload',       icon: 'upload', path: '/upload'       },
  ]
  const financeNav = [
    { id: 'accounts', label: 'Accounts', icon: 'card'     },
    { id: 'spending', label: 'Spending', icon: 'activity', path: '/spending' },
  ]

  const pctChange = lastTotal ? ((thisTotal - lastTotal) / lastTotal) * 100 : null

  return (
    <div className="dash-wrap">
      <header className="dash-nav">
        <Link to="/" className="dash-brand">Panther Ledger</Link>
        <div className="dash-nav-right">
          <button className="dash-icon-btn"><Icon name="bell" /></button>
          <button className="dash-icon-btn"><Icon name="search" /></button>
          <button className="dash-icon-btn" onClick={() => { clearSession(); navigate('/login') }} title="Log out">
            <Icon name="logout" />
          </button>
          <div className="dash-avatar">{firstName.slice(0, 2).toUpperCase()}</div>
        </div>
      </header>

      <div className="dash-body">
        <aside className="dash-sidebar">
          <p className="sidebar-section-label">Main</p>
          {mainNav.map(item => (
            <button key={item.id} className="sidebar-item" onClick={() => navigate(item.path)}>
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
          <p className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Finance</p>
          {financeNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${item.id === 'spending' ? 'active' : ''}`}
              onClick={() => item.path && navigate(item.path)}
            >
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="dash-main">
          {/* Header row */}
          <div className="sp-page-header">
            <div>
              <h1 className="rc-title">Spending</h1>
              <p className="tx-page-sub">{txCount} transactions this month</p>
            </div>
            <div className="sp-month-picker">
              <button className="sp-month-btn" onClick={prevMonth}><Icon name="chevron-left" size={16} /></button>
              <span className="sp-month-label">{MONTH_NAMES[month]} {year}</span>
              <button className="sp-month-btn" onClick={nextMonth}><Icon name="chevron-right" size={16} /></button>
            </div>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading spending data…</p>
          ) : (
            <>
              {/* Stat cards */}
              <div className="sp-stats">
                <div className="sp-stat-card">
                  <p className="sp-stat-label">TOTAL EXPENSES</p>
                  <p className="sp-stat-value" style={{ color: '#ef4444' }}>${thisTotal.toFixed(2)}</p>
                  {pctChange !== null && (
                    <p className="sp-stat-delta" style={{ color: pctChange > 0 ? '#ef4444' : '#22c55e' }}>
                      {pctChange > 0 ? '▲' : '▼'} {Math.abs(pctChange).toFixed(1)}% vs last month
                    </p>
                  )}
                </div>
                <div className="sp-stat-card">
                  <p className="sp-stat-label">TOTAL DEPOSITS</p>
                  <p className="sp-stat-value" style={{ color: '#22c55e' }}>${allDeposits.toFixed(2)}</p>
                </div>
                <div className="sp-stat-card">
                  <p className="sp-stat-label">NET</p>
                  <p className="sp-stat-value" style={{ color: allDeposits - thisTotal >= 0 ? '#22c55e' : '#ef4444' }}>
                    {allDeposits - thisTotal >= 0 ? '+' : ''}${(allDeposits - thisTotal).toFixed(2)}
                  </p>
                </div>
                <div className="sp-stat-card">
                  <p className="sp-stat-label">AVG / SPEND DAY</p>
                  <p className="sp-stat-value">${avgPerDay.toFixed(2)}</p>
                  <p className="sp-stat-delta" style={{ color: '#9ca3af' }}>{activeDays} active days</p>
                </div>
              </div>

              {/* Tab bar */}
              <div className="sp-toggle" style={{ marginBottom: '1rem' }}>
                <button
                  className={`sp-toggle-btn ${pageTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setPageTab('overview')}
                >Overview</button>
                <button
                  className={`sp-toggle-btn ${pageTab === 'cashflow' ? 'active' : ''}`}
                  onClick={() => setPageTab('cashflow')}
                >Cash Flow</button>
              </div>

              {pageTab === 'overview' ? (
                <>
                  {/* Line / Bar chart */}
                  <div className="card sp-chart-card">
                    <div className="sp-chart-header">
                      <p className="card-eyebrow" style={{ margin: 0 }}>
                        {chartMode === 'cumulative' ? 'Cumulative Spend' : 'Daily Spend'} — {MONTH_NAMES[month]}
                      </p>
                      <div className="sp-toggle">
                        <button
                          className={`sp-toggle-btn ${chartMode === 'cumulative' ? 'active' : ''}`}
                          onClick={() => setChartMode('cumulative')}
                        >Cumulative</button>
                        <button
                          className={`sp-toggle-btn ${chartMode === 'daily' ? 'active' : ''}`}
                          onClick={() => setChartMode('daily')}
                        >Daily</button>
                      </div>
                    </div>

                    {chartMode === 'cumulative' ? (
                      <LineChart
                        thisCum={thisCum} lastCum={lastCum}
                        thisDays={thisDays} lastDays={lastDays}
                        thisLabel={MONTH_NAMES[month]}
                        lastLabel={MONTH_NAMES[prevMonthIdx]}
                        maxVal={maxChartVal}
                        upToDay={upToDay}
                      />
                    ) : (
                      <DailyBarChart daily={thisDailyArr} days={thisDays} maxVal={maxDailyVal} />
                    )}
                  </div>

                  {/* Category breakdown — combined card */}
                  <div className="card sp-breakdown-combined">
                    <div className="sp-breakdown-combined-header">
                      <p className="card-eyebrow" style={{ margin: 0 }}>Spending by Category</p>
                      {selected && (
                        <button className="sp-clear-cat" onClick={() => setSelected(null)}>
                          <Icon name="x" size={12} /> Clear filter
                        </button>
                      )}
                    </div>
                    <div className="sp-breakdown-combined-body">
                      {/* Donut */}
                      <div className="sp-donut-wrap" style={{ flexShrink: 0 }}>
                        <Donut
                          slices={catData}
                          total={Math.round(thisTotal)}
                          selected={selected}
                          onSelect={setSelected}
                        />
                      </div>

                      {/* Category list */}
                      <div className="sp-cat-list sp-cat-list--inline">
                        {catData.length === 0 ? (
                          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No expenses this month.</p>
                        ) : catData.map(cat => {
                          const isOpen = selected === cat.label
                          const topTx  = isOpen ? topTxForCategory(expenses, year, month, cat.label) : []
                          return (
                            <div
                              key={cat.label}
                              className={`sp-cat-row ${isOpen ? 'selected' : ''}`}
                              onClick={() => setSelected(isOpen ? null : cat.label)}
                            >
                              <div className="sp-cat-top">
                                <div className="sp-cat-name-wrap">
                                  <span className="sp-cat-dot" style={{ background: cat.color }} />
                                  <span className="sp-cat-name">{cat.label}</span>
                                </div>
                                <div className="sp-cat-right">
                                  <span className="sp-cat-amount">${cat.amount.toFixed(2)}</span>
                                  <span className="sp-cat-pct">{Math.round(cat.pct * 100)}%</span>
                                </div>
                              </div>
                              <div className="sp-bar-bg">
                                <div className="sp-bar-fill" style={{ width: `${cat.pct * 100}%`, background: cat.color }} />
                              </div>

                              {isOpen && (
                                <div className="sp-cat-top-tx" onClick={e => e.stopPropagation()}>
                                  <p className="sp-cat-top-tx-label">Top contributors</p>
                                  {topTx.length === 0 ? (
                                    <p className="sp-cat-top-tx-empty">No transactions found.</p>
                                  ) : topTx.map((tx, i) => (
                                    <div key={i} className="sp-cat-tx-row">
                                      <span className="sp-cat-tx-rank" style={{ background: cat.color }}>{i + 1}</span>
                                      <span className="sp-cat-tx-name">{tx.name || tx.description || 'Transaction'}</span>
                                      <span className="sp-cat-tx-date">{fmtDate(tx.purchase_date)}</span>
                                      <span className="sp-cat-tx-amt">${(tx.amount || 0).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Cash Flow — placeholder */
                <div className="card sp-chart-card">
                  <p className="card-eyebrow" style={{ margin: 0 }}>Cash Flow</p>
                  <div className="sp-wip">
                    <span className="sp-wip-wrench">🔧</span>
                    <p className="sp-wip-label">Work in progress</p>
                  </div>
                </div>
              )}

              <p className="dash-footer-text">Florida International University</p>
            </>
          )}
        </main>
      </div>

      <button className="chat-fab">
        <Icon name="chat" size={20} />
        <span className="chat-dot" />
      </button>
    </div>
  )
}

export default Spending
