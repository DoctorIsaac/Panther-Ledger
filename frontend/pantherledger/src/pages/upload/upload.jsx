import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getSession, clearSession } from '../../api'
import '../dashboard/dashboard.css'
import './upload.css'

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
    case 'file':        return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
    case 'trash':       return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
    case 'check':       return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="20 6 9 17 4 12"/></svg>
    case 'arrow-right': return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    default:            return null
  }
}

/* ── Format date ── */
function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ── Account type label ── */
function accountTypeLabel(type) {
  if (type === 'credit_card') return 'Credit Card'
  if (type === 'bank') return 'Bank / Checking'
  return 'Unknown'
}

/* ── Upload Page ── */
const Upload = () => {
  const navigate = useNavigate()
  const session = getSession()
  const fileInputRef = useRef(null)

  const [file, setFile]             = useState(null)
  const [description, setDescription] = useState('')
  const [dragging, setDragging]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState('')
  const [documents, setDocuments]   = useState([])
  const [docsLoading, setDocsLoading] = useState(true)

  const firstName = session?.first_name || session?.username || 'there'
  const userInitials = firstName.slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!session) { navigate('/login'); return }
    fetchDocuments()
  }, [])

  function fetchDocuments() {
    api.get(`/documents/${session.user_id}`)
      .then(data => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setDocsLoading(false))
  }

  function handleFile(f) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }
    setError('')
    setResult(null)
    setFile(f)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', description)
      const data = await api.upload(`/documents/${session.user_id}`, formData)
      setResult(data)
      setFile(null)
      setDescription('')
      fetchDocuments()
    } catch (err) {
      setError(err?.detail || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(documentId) {
    try {
      await api.delete(`/documents/${session.user_id}/${documentId}`)
      setDocuments(prev => prev.filter(d => d.document_id !== documentId))
    } catch (err) {
      setError(err?.detail || 'Failed to delete document.')
    }
  }

  const mainNav = [
    { id: 'dashboard',    label: 'Dashboard',    icon: 'grid',   path: '/dashboard' },
    { id: 'transactions', label: 'Transactions', icon: 'dollar', path: '/transactions' },
    { id: 'recurring',    label: 'Recurring',    icon: 'users',  path: '/recurring' },
    { id: 'upload',       label: 'Upload',       icon: 'upload', path: '/upload'    },
  ]
  const financeNav = [
    { id: 'accounts', label: 'Accounts', icon: 'card'     },
    { id: 'spending', label: 'Spending', icon: 'activity' },
  ]

  return (
    <div className="dash-wrap">

      {/* Navbar */}
      <header className="dash-nav">
        <Link to="/" className="dash-brand">Panther Ledger</Link>
        <div className="dash-nav-right">
          <button className="dash-icon-btn"><Icon name="bell" /></button>
          <button className="dash-icon-btn"><Icon name="search" /></button>
          <button className="dash-icon-btn" onClick={() => { clearSession(); navigate('/login') }} title="Log out">
            <Icon name="logout" />
          </button>
          <div className="dash-avatar">{userInitials}</div>
        </div>
      </header>

      <div className="dash-body">

        {/* Sidebar */}
        <aside className="dash-sidebar">
          <p className="sidebar-section-label">Main</p>
          {mainNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${item.id === 'upload' ? 'active' : ''}`}
              onClick={() => item.path ? navigate(item.path) : null}
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
          <div className="up-page-header">
            <h1 className="rc-title">Upload Statement</h1>
            <p className="up-subtitle">Import PDF statements of your debit or credit card transactions.</p>
          </div>

          <div className="up-grid">

            {/* Upload form */}
            <div className="card up-form-card">
              <p className="card-eyebrow">New Upload</p>

              <form onSubmit={handleSubmit}>
                {/* Drop zone */}
                <div
                  className={`up-dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])}
                  />
                  {file ? (
                    <div className="up-file-selected">
                      <span className="up-file-icon"><Icon name="file" size={22} /></span>
                      <div>
                        <p className="up-file-name">{file.name}</p>
                        <p className="up-file-size">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="up-drop-prompt">
                      <span className="up-drop-icon"><Icon name="upload" size={28} /></span>
                      <p className="up-drop-label">Drop PDF here or <span className="up-drop-link">browse</span></p>
                      <p className="up-drop-hint">Bank statements and credit card statements supported</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="up-field">
                  <label className="up-label">Description <span className="up-optional">(optional)</span></label>
                  <input
                    className="up-input"
                    type="text"
                    placeholder="e.g. Chase March 2025"
                    maxLength={250}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                {error && <p className="up-error">{error}</p>}

                <button className="up-submit-btn" type="submit" disabled={!file || loading}>
                  {loading ? (
                    <><span className="up-spinner" /> Parsing statement…</>
                  ) : (
                    <><Icon name="upload" size={15} /> Upload &amp; Import</>
                  )}
                </button>
              </form>

              {/* Result */}
              {result && (
                <div className="up-result">
                  <div className="up-result-header">
                    <span className="up-result-check"><Icon name="check" size={16} /></span>
                    <p className="up-result-title">Import Complete</p>
                  </div>
                  <div className="up-result-rows">
                    <div className="up-result-row">
                      <span className="up-result-label">File</span>
                      <span className="up-result-value">{result.document?.file_name}</span>
                    </div>
                    <div className="up-result-row">
                      <span className="up-result-label">Account type</span>
                      <span className="up-result-value">{accountTypeLabel(result.document?.account_type)}</span>
                    </div>
                    <div className="up-result-row">
                      <span className="up-result-label">Transactions found</span>
                      <span className="up-result-value">{result.processed_text_count}</span>
                    </div>
                    <div className="up-result-row">
                      <span className="up-result-label">Imported</span>
                      <span className="up-result-value green">{result.insert_result?.created_count}</span>
                    </div>
                    {result.insert_result?.skipped_duplicates > 0 && (
                      <div className="up-result-row">
                        <span className="up-result-label">Skipped (duplicates)</span>
                        <span className="up-result-value muted">{result.insert_result.skipped_duplicates}</span>
                      </div>
                    )}
                  </div>
                  <button className="up-view-btn" onClick={() => navigate('/dashboard')}>
                    View transactions <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Past uploads */}
            <div className="card up-history-card">
              <p className="card-eyebrow">Past Uploads</p>
              {docsLoading ? (
                <p className="up-empty">Loading…</p>
              ) : documents.length === 0 ? (
                <p className="up-empty">No statements uploaded yet.</p>
              ) : (
                <div className="up-doc-list">
                  {documents.map(doc => (
                    <div key={doc.document_id} className="up-doc-row">
                      <span className="up-doc-icon"><Icon name="file" size={16} /></span>
                      <div className="up-doc-info">
                        <p className="up-doc-name">{doc.file_name}</p>
                        <p className="up-doc-meta">
                          {accountTypeLabel(doc.account_type)} · {fmtDate(doc.created_at)}
                          {doc.parsed_status === 'parsed' && <span className="up-doc-badge parsed">Parsed</span>}
                          {doc.parsed_status === 'parsed_empty' && <span className="up-doc-badge empty">No transactions</span>}
                        </p>
                      </div>
                      <button
                        className="up-doc-delete"
                        title="Delete"
                        onClick={() => handleDelete(doc.document_id)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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

export default Upload
