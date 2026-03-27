import { useState } from 'react'
import { Link } from 'react-router-dom'
import './terms.css'

const SECTIONS = [
  { n: 1, title: 'Acceptance of Terms' },
  { n: 2, title: 'Use of Service' },
  { n: 3, title: 'Account Responsibility' },
  { n: 4, title: 'Prohibited Activities' },
  { n: 5, title: 'Intellectual Property' },
  { n: 6, title: 'Termination' },
  { n: 7, title: 'Limitation of Liability' },
  { n: 8, title: 'Governing Law' },
]

const TERMS = [
  {
    n: 1,
    title: 'Acceptance of Terms',
    body: 'By creating an account or using Panther Ledger, you agree to these Terms of Service. If you do not agree, please do not use the platform. These terms apply to all users, including FIU students, faculty, and any affiliated individuals accessing the service.',
  },
  {
    n: 2,
    title: 'Use of Service',
    body: 'Panther Ledger is a personal finance tracking tool intended for educational and personal budgeting purposes. You agree to use the platform only for lawful purposes and in a manner consistent with all applicable university policies and regulations.',
  },
  {
    n: 3,
    title: 'Account Responsibility',
    body: 'You are responsible for maintaining the confidentiality of your login credentials. Any activity that occurs under your account is your responsibility. Notify us immediately if you suspect unauthorized access to your account.',
  },
  {
    n: 4,
    title: 'Prohibited Activities',
    body: 'You may not use Panther Ledger to engage in fraudulent activity, attempt to gain unauthorized access to other accounts, upload harmful or malicious content, or violate any applicable local, state, or federal laws.',
  },
  {
    n: 5,
    title: 'Intellectual Property',
    body: 'All content, logos, and software on Panther Ledger are the property of Panther Ledger or its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission.',
  },
  {
    n: 6,
    title: 'Termination',
    body: 'We reserve the right to suspend or terminate your account at any time if you violate these Terms of Service. You may also delete your account at any time through the account settings page.',
  },
  {
    n: 7,
    title: 'Limitation of Liability',
    body: 'Panther Ledger is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including financial decisions made based on data within the platform.',
  },
  {
    n: 8,
    title: 'Governing Law',
    body: 'These Terms are governed by the laws of the State of Florida. Any disputes arising from your use of Panther Ledger shall be resolved in the courts located in Miami-Dade County, Florida.',
  },
]

const PRIVACY = [
  {
    n: 1,
    title: 'Information We Collect',
    body: 'We collect information you provide directly, including your name, FIU email address, and financial transaction data you enter manually. We do not collect banking credentials.',
  },
  {
    n: 2,
    title: 'How We Use Your Data',
    body: 'Your data is used solely to provide and improve the Panther Ledger service. We do not sell your personal information to third parties.',
  },
  {
    n: 3,
    title: 'Data Security',
    body: 'We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest. However, no method of transmission over the internet is 100% secure.',
  },
  {
    n: 4,
    title: 'Data Retention',
    body: 'We retain your data for as long as your account is active. Upon account deletion, your personal data will be removed within 30 days.',
  },
]

const Terms = () => {
  const [activeTab, setActiveTab] = useState('terms')
  const [activeSection, setActiveSection] = useState(1)

  const content = activeTab === 'terms' ? TERMS : PRIVACY
  const sections = activeTab === 'terms'
    ? SECTIONS
    : PRIVACY.map((p) => ({ n: p.n, title: p.title }))

  return (
    <div className="terms-page">
      {/* Header */}
      <div className="terms-header">
        <span className="terms-brand">Panther Ledger</span>
        <Link to="/signup" className="terms-back-link">← Back to sign up</Link>
      </div>

      <div className="terms-body">
        {/* Left panel */}
        <div className="terms-left">
          <p className="terms-eyebrow">Legal Docs</p>
          <div className="terms-tabs">
            <button
              className={`terms-tab ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => { setActiveTab('terms'); setActiveSection(1) }}
            >
              Terms
            </button>
            <button
              className={`terms-tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => { setActiveTab('privacy'); setActiveSection(1) }}
            >
              Privacy
            </button>
          </div>

          <nav className="terms-nav">
            {sections.map((s) => (
              <a
                key={s.n}
                href={`#section-${s.n}`}
                className={`terms-nav-item ${activeSection === s.n ? 'active' : ''}`}
                onClick={() => setActiveSection(s.n)}
              >
                {s.n}. {s.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Right panel */}
        <div className="terms-right">
          <div className="terms-card">
            <h2 className="terms-card-title">
              {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </h2>
            <p className="terms-dates">
              Effective date: March 1, 2026 · Last updated: March 20, 2026
            </p>

            {content.map((section) => (
              <div
                key={section.n}
                id={`section-${section.n}`}
                className="terms-section"
              >
                <h3 className="terms-section-title">
                  {section.n}. {section.title}
                </h3>
                <p className="terms-section-body">{section.body}</p>
              </div>
            ))}

            <p className="terms-footer-text">Florida International University</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
