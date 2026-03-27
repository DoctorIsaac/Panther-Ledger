import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import './forgot-password.css'

const getStrength = (p) => {
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Very strong']

const STEPS = ['Enter your email', 'Verify the code', 'Set new password']

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(Array(6).fill(''))
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const codeRefs = useRef([])
  const strength = getStrength(newPass)
  const isSuccess = step === 4

  const handleCodeChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) codeRefs.current[i + 1]?.focus()
  }

  const handleCodeKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="fp-page">
      {/* Header */}
      <div className="fp-header">
        <span className="fp-brand">Panther Ledger</span>
        {!isSuccess && (
          step === 1
            ? <Link to="/login" className="fp-back-link">← Back to login</Link>
            : <button className="fp-back-link" onClick={handleBack}>← Back</button>
        )}
      </div>

      <div className="fp-body">
        {/* Left panel */}
        <div className="fp-left">
          <div className="fp-pl-badge">PL</div>

          <h2 className="fp-left-title">
            {isSuccess ? "You're all set, Panther." : 'Reset your\npassword'}
          </h2>
          <p className="fp-left-desc">
            {isSuccess
              ? 'Your password has been reset successfully.'
              : "We'll send a code to your email to verify it's you."}
          </p>

          <div className="fp-steps-list">
            {STEPS.map((label, i) => {
              const n = i + 1
              const done = isSuccess || step > n
              const active = !isSuccess && step === n
              return (
                <div className="fp-step-row" key={n}>
                  <div className={`fp-step-circle ${done ? 'done' : active ? 'active' : ''}`}>
                    {done ? '✓' : n}
                  </div>
                  <span className={`fp-step-text ${active ? 'active' : done ? 'done' : ''}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="fp-right">
          <div className="fp-card">

            {/* Step 1 — Enter email */}
            {step === 1 && (
              <>
                <h2 className="fp-card-title">Forgot your password?</h2>
                <p className="fp-card-sub">
                  Enter the email address linked to your Panther Ledger account and we'll send you a 6-digit reset code.
                </p>
                <div className="fp-form-group">
                  <label className="fp-label-upper">Email Address</label>
                  <input
                    type="email"
                    className="fp-input"
                    placeholder="steven@fiu.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="fp-helper">We'll only send a reset link to verified FIU email addresses.</p>
                </div>
                <div className="fp-actions">
                  <button className="fp-btn-primary" onClick={() => setStep(2)}>Send Reset Code</button>
                  <Link to="/login" className="fp-btn-cancel">Cancel</Link>
                </div>
              </>
            )}

            {/* Step 2 — Verify code */}
            {step === 2 && (
              <>
                <h2 className="fp-card-title">Enter the 6-digit code</h2>
                <p className="fp-card-sub">
                  A reset code was sent to <strong>{email || 'your email'}</strong>. It expires in 10 minutes.
                </p>
                <div className="code-inputs">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (codeRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="code-box"
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    />
                  ))}
                </div>
                <p className="fp-helper">
                  Didn't get it? <a href="#" className="fp-link">Resend code</a> · Check your spam folder.
                </p>
                <div className="fp-actions">
                  <button className="fp-btn-primary" onClick={() => setStep(3)}>Verify Code</button>
                  <button className="fp-btn-outline" onClick={() => setStep(1)}>← Use a different email</button>
                </div>
              </>
            )}

            {/* Step 3 — Set new password */}
            {step === 3 && (
              <>
                <h2 className="fp-card-title">Set a new password</h2>
                <p className="fp-card-sub">Your new password must be at least 8 characters and include a number.</p>
                <div className="fp-form-group">
                  <label className="fp-label-upper">New Password</label>
                  <div className="fp-pass-wrap">
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="fp-input"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                    <button className="fp-eye" onClick={() => setShowNew(!showNew)}>
                      {showNew ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {newPass && (
                    <>
                      <div className="strength-bar">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`strength-segment ${i <= strength ? 'active' : ''}`} />
                        ))}
                      </div>
                      <p className="strength-label">{strengthLabel[strength]}</p>
                    </>
                  )}
                </div>
                <div className="fp-form-group">
                  <label className="fp-label-upper">Confirm New Password</label>
                  <div className="fp-pass-wrap">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="fp-input"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                    />
                    <button className="fp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="fp-actions">
                  <button className="fp-btn-primary" onClick={() => setStep(4)}>Reset Password</button>
                </div>
              </>
            )}

            {/* Step 4 — Success */}
            {step === 4 && (
              <div className="fp-success">
                <div className="fp-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="fp-card-title">Password reset successful!</h2>
                <p className="fp-card-sub">Your new password is active. Log in to get back to managing your money.</p>
                <Link to="/login" className="fp-btn-primary fp-btn-block">Back to Log In</Link>
              </div>
            )}

            <p className="fp-footer-text">Florida International University</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
