import { Link } from 'react-router-dom'
import { Header, Footer } from '../../components'
import './features.css'

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    tag: 'Overview',
    title: 'Financial Dashboard',
    desc: 'See your complete financial picture at a glance. Your dashboard shows monthly spend, a live cumulative chart compared to last month, spending by category, recent transactions, and an upcoming bills calendar — all in one view.',
    bullets: ['Month-over-month spend chart', 'Spending by category donut chart', 'Recent transaction feed', 'Upcoming recurring bills calendar'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    tag: 'Transactions',
    title: 'Transaction Tracking',
    desc: 'Log every expense and deposit with full detail. Assign categories, add notes, mark transactions as recurring, and keep a complete history of where your money goes.',
    bullets: ['Log expenses and deposits', 'Assign categories to every transaction', 'Add optional descriptions/notes', 'Mark transactions as recurring'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    tag: 'Search & Filter',
    title: 'Smart Search & Filtering',
    desc: 'Quickly find any transaction using the search bar. Narrow results by type (expense or deposit), filter by category, and sort by date or amount in either direction.',
    bullets: ['Full-text search across all transactions', 'Filter by expense type or category', 'Sort by date (newest/oldest) or amount', 'One-click filter clearing'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
    tag: 'Recurring',
    title: 'Recurring Transactions',
    desc: 'Track bills, subscriptions, and regular income that repeat on a schedule. Set the frequency and Panther Ledger keeps tabs on upcoming due dates, showing them on your dashboard calendar.',
    bullets: ['Weekly, bi-weekly, and monthly schedules', 'Separate recurring income and bills', 'Calendar view of upcoming dates', 'Color-coded bill vs. income indicators'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    tag: 'Import',
    title: 'Bank Statement Upload',
    desc: 'Skip manual entry entirely. Upload a CSV export from your bank and Panther Ledger will import your transactions automatically, saving you time and reducing errors.',
    bullets: ['CSV bank statement import', 'Automatic transaction parsing', 'Instant population of your history', 'Supports common bank export formats'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    tag: 'Analytics',
    title: 'Spending Analytics',
    desc: 'Understand your habits with data. View your total expenses, total deposits, and net balance for any period. The interactive category chart lets you hover over slices to see exact amounts and percentages.',
    bullets: ['Total expenses, deposits & net summary', 'Interactive category breakdown chart', 'Month-to-month comparison', 'Per-transaction-count tracking'],
  },
]

const FeaturesPage = () => {
  return (
    <div className="fp-page">
      <Header />

      <section className="fp-hero">
        <div className="fp-hero-inner">
          <p className="fp-eyebrow">Everything you need</p>
          <h1 className="fp-hero-heading">Features built for FIU students</h1>
          <p className="fp-hero-sub">
            Panther Ledger gives you the tools to track spending, manage recurring bills,
            and understand your finances — without the complexity of traditional budgeting apps.
          </p>
          <div className="fp-hero-ctas">
            <Link to="/signup" className="fp-cta-primary">Get started free</Link>
            <Link to="/login" className="fp-cta-secondary">Log in</Link>
          </div>
        </div>
      </section>

      <section className="fp-list">
        <div className="fp-list-inner">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`fp-item ${i % 2 === 1 ? 'fp-item--reverse' : ''}`}>
              <div className="fp-item-icon-col">
                <div className="fp-item-icon-wrap">{f.icon}</div>
              </div>
              <div className="fp-item-text">
                <p className="fp-item-tag">{f.tag}</p>
                <h2 className="fp-item-title">{f.title}</h2>
                <p className="fp-item-desc">{f.desc}</p>
                <ul className="fp-item-bullets">
                  {f.bullets.map(b => (
                    <li key={b}>
                      <span className="fp-bullet-dot" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="fp-cta-banner">
        <div className="fp-cta-banner-inner">
          <h2 className="fp-cta-heading">Ready to take control of your finances?</h2>
          <p className="fp-cta-sub">Join other FIU students managing their money the smart way.</p>
          <Link to="/signup" className="fp-cta-primary">Create your free account</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default FeaturesPage
