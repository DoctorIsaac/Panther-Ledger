import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getSession } from '../../api'
import { AppLayout, Icon } from '../../components'
import './upload.css'

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

  return (
    <AppLayout activeNav="upload">
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
    </AppLayout>
  )
}

export default Upload
