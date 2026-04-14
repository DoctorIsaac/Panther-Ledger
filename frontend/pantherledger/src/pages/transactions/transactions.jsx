import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getSession, clearSession } from '../../api'
import '../dashboard/dashboard.css'
import './transactions.css'

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
    case 'chat':        return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'logout':      return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'upload':      return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    case 'plus':        return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'trash':       return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
    case 'chevron-down':return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="6 9 12 15 18 9"/></svg>
    case 'x':           return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    case 'repeat':      return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    default:            return null
  }
}

const AVATAR_COLORS = [
  { bg: '#bfdbfe', color: '#1d4ed8' },
  { bg: '#bbf7d0', color: '#15803d' },
  { bg: '#e0e7ff', color: '#4338ca' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#fef3c7', color: '#b45309' },
  { bg: '#fae8ff', color: '#a21caf' },
  { bg: '#fee2e2', color: '#b91c1c' },
  { bg: '#d1fae5', color: '#065f46' },
]

const CAT_COLORS = [
  { color: '#059669', bg: '#d1fae5' },
  { color: '#7c3aed', bg: '#ede9fe' },
  { color: '#0284c7', bg: '#e0f2fe' },
  { color: '#a21caf', bg: '#fae8ff' },
  { color: '#d97706', bg: '#fef3c7' },
  { color: '#dc2626', bg: '#fee2e2' },
]

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const today = () => new Date().toISOString().slice(0, 10)

const BLANK_FORM = {
  name: '', amount: '', category_ref: '', expense_type: 'expense',
  purchase_date: today(), description: '', is_recurring: false, frequency: 'monthly',
}

/* ── Add Transaction Modal ── */
const AddModal = ({ categories, onClose, onSave }) => {
  const [form, setForm] = useState(BLANK_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return setError('Enter a valid amount.')
    if (!form.category_ref) return setError('Select a category.')
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: form.name.trim(),
        amount: Number(form.amount),
        category_ref: form.category_ref,
        expense_type: form.expense_type,
        purchase_date: form.purchase_date,
        description: form.description.trim(),
        is_recurring: form.is_recurring,
        frequency: form.is_recurring ? form.frequency : '',
      })
      onClose()
    } catch (err) {
      setError(err?.detail || 'Failed to save transaction.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <p className="modal-title">Add Transaction</p>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Name</label>
              <input className="modal-input" maxLength={25} placeholder="e.g. Grocery run"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Amount ($)</label>
              <input className="modal-input" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Category</label>
              <select className="modal-input" value={form.category_ref} onChange={e => set('category_ref', e.target.value)}>
                <option value="">Select…</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label">Type</label>
              <select className="modal-input" value={form.expense_type} onChange={e => set('expense_type', e.target.value)}>
                <option value="expense">Expense</option>
                <option value="deposit">Deposit / Income</option>
              </select>
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Date</label>
              <input className="modal-input" type="date" value={form.purchase_date}
                onChange={e => set('purchase_date', e.target.value)} />
            </div>
            <div className="modal-field modal-field-check">
              <label className="modal-label">Recurring</label>
              <div className="modal-check-row">
                <input type="checkbox" id="is_recurring" checked={form.is_recurring}
                  onChange={e => set('is_recurring', e.target.checked)} />
                <label htmlFor="is_recurring" className="modal-check-label">This repeats</label>
              </div>
            </div>
          </div>

          {form.is_recurring && (
            <div className="modal-field">
              <label className="modal-label">Frequency</label>
              <select className="modal-input" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}

          <div className="modal-field">
            <label className="modal-label">Description <span className="modal-optional">(optional)</span></label>
            <input className="modal-input" maxLength={250} placeholder="Add a note…"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-save" disabled={saving}>
              {saving ? 'Saving…' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Transactions Page ── */
const Transactions = () => {
  const navigate  = useNavigate()
  const session   = getSession()
  const firstName = session?.first_name || session?.username || 'there'

  const [expenses,   setExpenses]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [openDrop,   setOpenDrop]   = useState(null)

  // filters
  const [search,    setSearch]    = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [sortKey,    setSortKey]    = useState('date_desc')

  useEffect(() => {
    if (!session) { navigate('/login'); return }
    Promise.all([
      api.get(`/expenses/${session.user_id}`),
      api.get(`/categories/${session.user_id}`),
    ])
      .then(([exp, cats]) => {
        setExpenses(Array.isArray(exp) ? exp : [])
        setCategories(Array.isArray(cats?.categories) ? cats.categories : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(data) {
    const created = await api.post(`/expenses/${session.user_id}`, data)
    // re-fetch to get category_name joined
    const updated = await api.get(`/expenses/${session.user_id}`)
    setExpenses(Array.isArray(updated) ? updated : [])
    return created
  }

  async function handleDelete(expense_id) {
    await api.delete(`/expenses/${session.user_id}/${expense_id}`)
    setExpenses(prev => prev.filter(e => e.expense_id !== expense_id))
  }

  // stable category → color map
  const catColorMap = useMemo(() => {
    const map = {}
    ;[...new Set(expenses.map(e => e.category_name).filter(Boolean))].forEach((cat, i) => {
      map[cat] = CAT_COLORS[i % CAT_COLORS.length]
    })
    return map
  }, [expenses])

  const CATEGORIES_LIST = useMemo(() => [...new Set(expenses.map(e => e.category_name).filter(Boolean))], [expenses])

  const filtered = useMemo(() => {
    let list = [...expenses]
    if (search.trim()) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    if (typeFilter)    list = list.filter(e => e.expense_type === typeFilter)
    if (catFilter)     list = list.filter(e => e.category_name === catFilter)
    if (sortKey === 'date_desc')  list.sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''))
    if (sortKey === 'date_asc')   list.sort((a, b) => (a.purchase_date || '').localeCompare(b.purchase_date || ''))
    if (sortKey === 'amt_desc')   list.sort((a, b) => b.amount - a.amount)
    if (sortKey === 'amt_asc')    list.sort((a, b) => a.amount - b.amount)
    return list
  }, [expenses, search, typeFilter, catFilter, sortKey])

  const stats = useMemo(() => {
    const totalExpenses = expenses.filter(e => e.expense_type === 'expense').reduce((s, e) => s + (e.amount || 0), 0)
    const totalDeposits = expenses.filter(e => e.expense_type === 'deposit').reduce((s, e) => s + (e.amount || 0), 0)
    return { totalExpenses, totalDeposits, net: totalDeposits - totalExpenses, count: expenses.length }
  }, [expenses])

  const mainNav = [
    { id: 'dashboard',    label: 'Dashboard',    icon: 'grid',   path: '/dashboard'    },
    { id: 'transactions', label: 'Transactions', icon: 'dollar', path: '/transactions' },
    { id: 'recurring',    label: 'Recurring',    icon: 'users',  path: '/recurring'    },
    { id: 'upload',       label: 'Upload',       icon: 'upload', path: '/upload'       },
  ]
  const financeNav = [
    { id: 'accounts', label: 'Accounts', icon: 'card'     },
    { id: 'spending', label: 'Spending', icon: 'activity' },
  ]

  return (
    <div className="dash-wrap" onClick={() => setOpenDrop(null)}>

      {/* Navbar */}
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

        {/* Sidebar */}
        <aside className="dash-sidebar">
          <p className="sidebar-section-label">Main</p>
          {mainNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${item.id === 'transactions' ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
          <p className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Finance</p>
          {financeNav.map(item => (
            <button key={item.id} className="sidebar-item">
              <span className="sidebar-item-icon"><Icon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="dash-main">

          {/* Page header */}
          <div className="tx-page-header">
            <div>
              <h1 className="rc-title">Transactions</h1>
              <p className="tx-page-sub">{stats.count} total transactions</p>
            </div>
            <button className="tx-add-btn" onClick={() => setShowModal(true)}>
              <Icon name="plus" size={15} /> Add Transaction
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading transactions…</p>
          ) : (
            <>
              {/* Stat cards */}
              <div className="tx-stats">
                <div className="tx-stat-card">
                  <p className="tx-stat-label">TOTAL EXPENSES</p>
                  <p className="tx-stat-value red">-${stats.totalExpenses.toFixed(2)}</p>
                </div>
                <div className="tx-stat-card">
                  <p className="tx-stat-label">TOTAL DEPOSITS</p>
                  <p className="tx-stat-value green">+${stats.totalDeposits.toFixed(2)}</p>
                </div>
                <div className="tx-stat-card">
                  <p className="tx-stat-label">NET</p>
                  <p className={`tx-stat-value ${stats.net >= 0 ? 'green' : 'red'}`}>
                    {stats.net >= 0 ? '+' : ''}${stats.net.toFixed(2)}
                  </p>
                </div>
                <div className="tx-stat-card">
                  <p className="tx-stat-label">TRANSACTIONS</p>
                  <p className="tx-stat-value dark">{stats.count}</p>
                </div>
              </div>

              {/* Filter bar */}
              <div className="tx-filter-bar" onClick={e => e.stopPropagation()}>
                <div className="tx-search-wrap">
                  <Icon name="search" size={14} />
                  <input
                    className="tx-search-input"
                    placeholder="Search transactions…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {/* Type filter */}
                <div className="tx-drop-wrap">
                  <button
                    className={`tx-filter-btn ${openDrop === 'type' ? 'open' : ''} ${typeFilter ? 'active' : ''}`}
                    onClick={() => setOpenDrop(o => o === 'type' ? null : 'type')}
                  >
                    Type <Icon name="chevron-down" size={13} />
                  </button>
                  {openDrop === 'type' && (
                    <div className="tx-dropdown">
                      {[['', 'All types'], ['expense', 'Expenses'], ['deposit', 'Deposits']].map(([val, label]) => (
                        <button key={val} className={`tx-drop-item ${typeFilter === val ? 'selected' : ''}`}
                          onClick={() => { setTypeFilter(val); setOpenDrop(null) }}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category filter */}
                <div className="tx-drop-wrap">
                  <button
                    className={`tx-filter-btn ${openDrop === 'cat' ? 'open' : ''} ${catFilter ? 'active' : ''}`}
                    onClick={() => setOpenDrop(o => o === 'cat' ? null : 'cat')}
                  >
                    Category <Icon name="chevron-down" size={13} />
                  </button>
                  {openDrop === 'cat' && (
                    <div className="tx-dropdown">
                      <button className={`tx-drop-item ${!catFilter ? 'selected' : ''}`}
                        onClick={() => { setCatFilter(''); setOpenDrop(null) }}>All categories</button>
                      {CATEGORIES_LIST.map(cat => (
                        <button key={cat} className={`tx-drop-item ${catFilter === cat ? 'selected' : ''}`}
                          onClick={() => { setCatFilter(cat); setOpenDrop(null) }}
                          style={{ textTransform: 'capitalize' }}>{cat}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div className="tx-drop-wrap">
                  <button
                    className={`tx-filter-btn ${openDrop === 'sort' ? 'open' : ''}`}
                    onClick={() => setOpenDrop(o => o === 'sort' ? null : 'sort')}
                  >
                    Sort <Icon name="chevron-down" size={13} />
                  </button>
                  {openDrop === 'sort' && (
                    <div className="tx-dropdown">
                      {[
                        ['date_desc', 'Newest first'],
                        ['date_asc',  'Oldest first'],
                        ['amt_desc',  'Amount: high → low'],
                        ['amt_asc',   'Amount: low → high'],
                      ].map(([val, label]) => (
                        <button key={val} className={`tx-drop-item ${sortKey === val ? 'selected' : ''}`}
                          onClick={() => { setSortKey(val); setOpenDrop(null) }}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                {(search || typeFilter || catFilter) && (
                  <button className="tx-clear-btn" onClick={() => { setSearch(''); setTypeFilter(''); setCatFilter('') }}>
                    Clear filters
                  </button>
                )}
              </div>

              {/* Transaction list */}
              <div className="card tx-list-card">
                {filtered.length === 0 ? (
                  <p className="tx-empty">
                    {expenses.length === 0 ? 'No transactions yet. Add one or upload a bank statement.' : 'No transactions match your filters.'}
                  </p>
                ) : (
                  <div className="tx-full-list">
                    {filtered.map((tx, idx) => {
                      const isDeposit = tx.expense_type === 'deposit'
                      const palette   = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                      const catStyle  = catColorMap[tx.category_name] || CAT_COLORS[0]
                      const initials  = (tx.name || '??').slice(0, 2).toUpperCase()
                      return (
                        <div key={tx.expense_id} className="tx-full-row">
                          <div className="tx-avatar" style={{ background: palette.bg, color: palette.color }}>
                            {initials}
                          </div>
                          <div className="tx-info">
                            <div className="tx-top">
                              <span className="tx-label" style={{ textTransform: 'capitalize' }}>{tx.name}</span>
                              {tx.is_recurring && (
                                <span className="tx-recurring-badge">
                                  <Icon name="repeat" size={11} /> {tx.frequency}
                                </span>
                              )}
                            </div>
                            <div className="tx-sub-row">
                              <span className="tx-cat-badge" style={{ color: catStyle.color, background: catStyle.bg }}>
                                {tx.category_name || 'Uncategorized'}
                              </span>
                              {tx.description && <span className="tx-desc">{tx.description}</span>}
                            </div>
                          </div>
                          <div className="tx-right">
                            <span className="tx-amount" style={{ color: isDeposit ? '#16a34a' : '#111827' }}>
                              {isDeposit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                            </span>
                            <span className="tx-date">{fmtDate(tx.purchase_date)}</span>
                          </div>
                          <button
                            className="tx-delete-btn"
                            title="Delete"
                            onClick={() => handleDelete(tx.expense_id)}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <p className="dash-footer-text">Florida International University</p>
        </main>
      </div>

      {showModal && (
        <AddModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
        />
      )}

      <button className="chat-fab">
        <Icon name="chat" size={20} />
        <span className="chat-dot" />
      </button>
    </div>
  )
}

export default Transactions
