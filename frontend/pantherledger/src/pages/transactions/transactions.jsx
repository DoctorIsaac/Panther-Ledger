import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getSession } from '../../api'
import { AppLayout, Icon } from '../../components'
import './transactions.css'

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

  // pagination
  const [pageSize, setPageSize] = useState(25)
  const [page,     setPage]     = useState(1)

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

  // reset to page 1 when filters/page size change
  useEffect(() => { setPage(1) }, [search, typeFilter, catFilter, sortKey, pageSize])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = useMemo(() => {
    const totalExpenses = expenses.filter(e => e.expense_type === 'expense').reduce((s, e) => s + (e.amount || 0), 0)
    const totalDeposits = expenses.filter(e => e.expense_type === 'deposit').reduce((s, e) => s + (e.amount || 0), 0)
    return { totalExpenses, totalDeposits, net: totalDeposits - totalExpenses, count: expenses.length }
  }, [expenses])

  return (
    <AppLayout activeNav="transactions">
      <div onClick={() => setOpenDrop(null)}>

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
                {filtered.length > 0 && (
                  <div className="tx-pagination">
                    <div className="tx-page-size">
                      <span className="tx-page-size-label">Rows per page:</span>
                      {[10, 25, 50].map(n => (
                        <button
                          key={n}
                          className={`tx-page-size-btn ${pageSize === n ? 'active' : ''}`}
                          onClick={() => setPageSize(n)}
                        >{n}</button>
                      ))}
                    </div>
                    <span className="tx-page-info">
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                    </span>
                    <div className="tx-page-nav">
                      <button className="tx-page-btn" onClick={() => setPage(1)}          disabled={page === 1}>«</button>
                      <button className="tx-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                      <button className="tx-page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                      <button className="tx-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                    </div>
                  </div>
                )}
                {filtered.length === 0 ? (
                  <p className="tx-empty">
                    {expenses.length === 0 ? 'No transactions yet. Add one or upload a bank statement.' : 'No transactions match your filters.'}
                  </p>
                ) : (
                  <div className="tx-full-list">
                    {paginated.map((tx, idx) => {
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

      {showModal && (
        <AddModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
        />
      )}

      </div>
    </AppLayout>
  )
}

export default Transactions
