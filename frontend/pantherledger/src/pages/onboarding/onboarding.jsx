import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './onboarding.css'

/* ── Goal cards ── */
const GOALS = [
  { id: 'track',   icon: '$',  iconBg: '#fef3c7', iconColor: '#d97706', title: 'Track my spending',  desc: 'See where my money is going each month' },
  { id: 'save',    icon: '🔖', iconBg: '#d1fae5', iconColor: '#059669', title: 'Save more money',    desc: 'Build an emergency fund or save for goals' },
  { id: 'debt',    icon: '💳', iconBg: '#fee2e2', iconColor: '#dc2626', title: 'Manage my debt',     desc: 'Pay off credit cards or student loans faster' },
  { id: 'wealth',  icon: '📈', iconBg: '#d1fae5', iconColor: '#059669', title: 'Grow my wealth',    desc: 'Invest and build long-term financial health' },
]

/* ── Banks ── */
const BANKS = [
  { id: 'wf',    initials: 'WF', name: 'Wells Fargo',    bg: '#d9363e', color: '#fff' },
  { id: 'ch',    initials: 'CH', name: 'Chase',          bg: '#081E3F', color: '#fff' },
  { id: 'ba',    initials: 'BA', name: 'Bank of America',bg: '#004a97', color: '#fff' },
  { id: 'al',    initials: 'AL', name: 'Ally Bank',      bg: '#7c3aed', color: '#fff' },
  { id: 'su',    initials: 'SU', name: 'SunTrust',       bg: '#1e3a2f', color: '#fff' },
  { id: 'other', initials: '+',  name: 'Other bank',     bg: '#f3f4f6', color: '#6b7280' },
]

/* ── Left-panel content per step ── */
const LEFT = [
  { title: "Let's get you\nset up, Steven.", desc: 'Just a few steps to personalize your Panther Ledger experience.' },
  { title: 'Tell us about\nyour finances.',  desc: 'This helps Penny give you smarter, more relevant advice.' },
  { title: 'Connect your\naccounts.',        desc: 'Link your bank so Penny can auto-import transactions and track your balance live.' },
  { title: 'Stay in the\nloop.',             desc: "Get nudged when it matters most — and not when it doesn't." },
]

/* ── Toggle ── */
const Toggle = ({ checked, onChange }) => (
  <button className={`toggle ${checked ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={checked} />
)

const Onboarding = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  /* Step 1 */
  const [goals, setGoals] = useState(['track', 'save'])
  const toggleGoal = (id) => setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])

  /* Step 2 */
  const [income, setIncome]         = useState('2,400')
  const [incomeFreq, setIncomeFreq] = useState('Bi-weekly')
  const [employment, setEmployment] = useState('Part-time student worker')
  const [rent, setRent]             = useState('')
  const [savings, setSavings]       = useState(300)

  /* Step 3 */
  const [bank, setBank] = useState('wf')
  const selectedBank = BANKS.find(b => b.id === bank)

  /* Step 4 */
  const [notifs, setNotifs] = useState({
    weekly:      true,
    overspend:   true,
    bills:       true,
    penny:       true,
    promo:       false,
  })
  const toggleNotif = (k) => setNotifs(prev => ({ ...prev, [k]: !prev[k] }))

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const isSuccess = step === 5

  return (
    <div className="ob-page">

      {/* ── Header ── */}
      <div className="ob-header">
        <Link to="/" className="ob-brand">Panther Ledger</Link>
        <span className="ob-step-label">
          {isSuccess ? 'All done!' : `Step ${step} of 5`}
        </span>
      </div>

      {/* ── Body ── */}
      <div className={`ob-body ${isSuccess ? 'ob-body--success' : ''}`}>

        {/* Left panel (hidden on step 5) */}
        {!isSuccess && (
          <div className="ob-left">
            <div className="ob-pl-badge">PL</div>
            <h2 className="ob-left-title">{LEFT[step - 1].title}</h2>
            <p className="ob-left-desc">{LEFT[step - 1].desc}</p>
            <div className="ob-dots">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`ob-dot ${n === step ? 'active' : ''}`} />
              ))}
            </div>
          </div>
        )}

        {/* Right panel */}
        <div className={`ob-right ${isSuccess ? 'ob-right--success' : ''}`}>
          <div className={`ob-card ${isSuccess ? 'ob-card--success' : ''}`}>

            {/* ── Step 1: Goals ── */}
            {step === 1 && (
              <>
                <h2 className="ob-card-title">What brings you to Panther Ledger?</h2>
                <p className="ob-card-sub">Select all that apply — we'll tailor your dashboard around your goals.</p>
                <div className="goals-grid">
                  {GOALS.map(g => (
                    <button
                      key={g.id}
                      className={`goal-card ${goals.includes(g.id) ? 'selected' : ''}`}
                      onClick={() => toggleGoal(g.id)}
                    >
                      <div className="goal-card-top">
                        <div className="goal-icon" style={{ background: g.iconBg, color: g.iconColor }}>{g.icon}</div>
                        <div className={`goal-check ${goals.includes(g.id) ? 'checked' : ''}`}>✓</div>
                      </div>
                      <p className="goal-title">{g.title}</p>
                      <p className="goal-desc">{g.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="ob-actions">
                  <button className="ob-btn-primary" onClick={next}>Continue →</button>
                  <button className="ob-btn-skip" onClick={next}>Skip for now</button>
                </div>
              </>
            )}

            {/* ── Step 2: Income ── */}
            {step === 2 && (
              <>
                <h2 className="ob-card-title">Your income &amp; profile</h2>
                <p className="ob-card-sub">We use this to set realistic budget suggestions. You can update anytime.</p>
                <div className="income-grid">
                  <div className="ob-form-group">
                    <label className="ob-label-upper">Monthly Income (After Tax)</label>
                    <input className="ob-input ob-input--dark" value={income} onChange={e => setIncome(e.target.value)} />
                  </div>
                  <div className="ob-form-group">
                    <label className="ob-label-upper">Income Frequency</label>
                    <select className="ob-select" value={incomeFreq} onChange={e => setIncomeFreq(e.target.value)}>
                      <option>Weekly</option>
                      <option>Bi-weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                  <div className="ob-form-group">
                    <label className="ob-label-upper">Employment Status</label>
                    <select className="ob-select" value={employment} onChange={e => setEmployment(e.target.value)}>
                      <option>Full-time employee</option>
                      <option>Part-time student worker</option>
                      <option>Self-employed / Freelance</option>
                      <option>Unemployed</option>
                    </select>
                  </div>
                  <div className="ob-form-group">
                    <label className="ob-label-upper">Monthly Rent / Housing</label>
                    <input className="ob-input ob-input--dark" placeholder="e.g. 900" value={rent} onChange={e => setRent(e.target.value)} />
                  </div>
                </div>
                <div className="ob-form-group" style={{ marginTop: '1rem' }}>
                  <label className="ob-label-upper">Monthly Savings Goal</label>
                  <div className="slider-row">
                    <span className="slider-min">$0</span>
                    <input
                      type="range" min="0" max="1000" step="25"
                      value={savings}
                      onChange={e => setSavings(Number(e.target.value))}
                      className="ob-slider"
                      style={{ '--pct': `${(savings / 1000) * 100}%` }}
                    />
                    <span className="slider-max">$1,000</span>
                    <span className="slider-val">${savings}/mo</span>
                  </div>
                </div>
                <div className="ob-actions">
                  <button className="ob-btn-back" onClick={back}>← Back</button>
                  <button className="ob-btn-primary" onClick={next}>Continue →</button>
                  <button className="ob-btn-skip" onClick={next}>Skip for now</button>
                </div>
              </>
            )}

            {/* ── Step 3: Bank ── */}
            {step === 3 && (
              <>
                <h2 className="ob-card-title">Link your bank account</h2>
                <p className="ob-card-sub">Choose your bank below. We use 256-bit encryption and read-only access — we never touch your funds.</p>
                <div className="security-badge">
                  <span className="security-dot">🔒</span>
                  Secured by 256-bit SSL encryption · Read-only access · Never stores credentials
                </div>
                <div className="banks-grid">
                  {BANKS.map(b => (
                    <button
                      key={b.id}
                      className={`bank-card ${bank === b.id ? 'selected' : ''}`}
                      onClick={() => setBank(b.id)}
                    >
                      <div className="bank-avatar" style={{ background: b.bg, color: b.color }}>{b.initials}</div>
                      <span className="bank-name">{b.name}</span>
                    </button>
                  ))}
                </div>
                <div className="ob-actions">
                  <button className="ob-btn-back" onClick={back}>← Back</button>
                  <button className="ob-btn-primary" onClick={next}>
                    Link {selectedBank?.name} →
                  </button>
                  <button className="ob-btn-skip" onClick={next}>Skip — I'll do this later</button>
                </div>
              </>
            )}

            {/* ── Step 4: Notifications ── */}
            {step === 4 && (
              <>
                <h2 className="ob-card-title">Notification preferences</h2>
                <p className="ob-card-sub">You can change these anytime in Settings. We'll never spam you.</p>
                <div className="notif-list">
                  {[
                    { key: 'weekly',    title: 'Weekly spending summary',  desc: "A digest every Sunday of your week's transactions" },
                    { key: 'overspend', title: 'Overspending alerts',      desc: 'Get notified when a category is trending over budget' },
                    { key: 'bills',     title: 'Upcoming bill reminders',  desc: 'Alerts 3 days before a recurring charge hits' },
                    { key: 'penny',     title: 'Penny AI tips',            desc: 'Personalized financial insights from your AI assistant' },
                    { key: 'promo',     title: 'Promotional emails',       desc: 'News, product updates, and offers from Panther Ledger' },
                  ].map(n => (
                    <div className="notif-row" key={n.key}>
                      <div className="notif-info">
                        <span className="notif-title">{n.title}</span>
                        <span className="notif-desc">{n.desc}</span>
                      </div>
                      <Toggle checked={notifs[n.key]} onChange={() => toggleNotif(n.key)} />
                    </div>
                  ))}
                </div>
                <div className="ob-actions">
                  <button className="ob-btn-back" onClick={back}>← Back</button>
                  <button className="ob-btn-primary" onClick={next}>Continue →</button>
                </div>
              </>
            )}

            {/* ── Step 5: Success ── */}
            {step === 5 && (
              <div className="ob-success">
                <div className="ob-success-icon">✓</div>
                <h2 className="ob-success-title">You're all set, Steven! 🎉</h2>
                <p className="ob-success-sub">
                  Your Panther Ledger account is ready. We've set up your dashboard based on your goals and preferences — Penny is standing by to help.
                </p>
                <div className="ob-pills">
                  {goals.includes('track') && <span className="ob-pill green">Tracking spending</span>}
                  {savings > 0            && <span className="ob-pill green">Saving ${savings}/mo</span>}
                  {bank !== 'other'       && <span className="ob-pill green">{selectedBank?.name} linked</span>}
                  {notifs.bills           && <span className="ob-pill green">Bill reminders on</span>}
                </div>
                <div className="ob-pills">
                  {notifs.penny && <span className="ob-pill gold">Penny AI enabled</span>}
                </div>
                <button className="ob-btn-primary ob-btn-large" onClick={() => navigate('/dashboard')}>
                  Go to my Dashboard →
                </button>
              </div>
            )}

            <p className="ob-footer-text">Florida International University</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
