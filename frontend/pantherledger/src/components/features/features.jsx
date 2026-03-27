import './features.css'

const featureCards = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: 'Track every expense',
    desc: 'Log dining, textbooks, and transport in seconds. Know where every dollar goes.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Set smart budgets',
    desc: 'Create limits by category and get notified before you overspend.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Visualize your progress',
    desc: 'See monthly trends and charts that make your financial health clear at a glance.',
  },
]

const steps = [
  {
    n: '1',
    title: 'Create your free account',
    desc: 'Sign up with your FIU email in under a minute — no credit card needed.',
  },
  {
    n: '2',
    title: 'Add your transactions',
    desc: 'Log expenses manually or link your bank to import them automatically.',
  },
  {
    n: '3',
    title: 'See your insights',
    desc: 'Get personalized spending breakdowns and budget recommendations.',
  },
]

const Features = () => {
  return (
    <>
      {/* Why Panther Ledger */}
      <section className="features">
        <div className="features-container">
          <p className="features-eyebrow">Why Panther Ledger</p>
          <h2 className="features-heading">Built for FIU students</h2>
          <div className="features-cards">
            {featureCards.map((card) => (
              <div className="feature-card" key={card.title}>
                <div className="feature-icon">{card.icon}</div>
                <div>
                  <h3 className="feature-card-title">{card.title}</h3>
                  <p className="feature-card-desc">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="features-container">
          <p className="features-eyebrow">Get Started Fast</p>
          <h2 className="hiw-heading">How it works</h2>
          <div className="hiw-steps">
            {steps.map((step) => (
              <div className="hiw-step" key={step.n}>
                <div className="hiw-number">{step.n}</div>
                <div>
                  <h3 className="hiw-step-title">{step.title}</h3>
                  <p className="hiw-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="features-container cta-inner">
          <h2 className="cta-heading">Take control of your money today</h2>
          <p className="cta-sub">Join other FIU students managing their finances the smart way.</p>
          <button className="cta-btn">Get Started — It's Free</button>
        </div>
      </section>
    </>
  )
}

export default Features
