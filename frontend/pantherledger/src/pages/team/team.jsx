import { Header, Footer } from '../../components'
import './team.css'

// ── Drop your portrait files into src/assets/ and import them here ──
import stevenImg      from '../../assets/team/steven.jpg'
import jaedonImg      from '../../assets/team/jaedon.jpg'
import carlvenskyImg  from '../../assets/team/carlvensky.jpg'
import anthonyImg     from '../../assets/team/anthony.gif'
import teamBg        from '../../assets/team-bg.mp4'

// ── Shift the vidçeo vertically. 0% = top, 50% = center, 100% = bottom.
const VIDEO_POS_Y = '20%'
// import carlosImg      from '../../assets/carlos.jpg'
// import jaedonImg      from '../../assets/jaedon.jpg'
// import carlvenskyImg  from '../../assets/carlvensky.jpg'
// import anthonyImg     from '../../assets/anthony.jpg'

// ── pos controls where the photo is framed (0–100).
//    { x: 50, y: 50 } = centered.
//    Increase x to pan right, decrease to pan left.
//    Increase y to pan down,  decrease to pan up.
const TEAM_MEMBERS = [
  {
    id: 'member-1',
    name: 'Steven Velasquez',
    role: 'Full Stack Developer',
    bio: 'Hello, I am Steven Velasquez a second-year computer science and mathematics student at FIU. I currently have a deep interest in full stack development and data engineering.',
    photo: stevenImg,
    pos: { x: 50, y: 20 },
    github: 'https://github.com/DoctorIsaac',
    linkedin: 'https://www.linkedin.com/in/stevenisaacvelasquez',
  },
  {
    id: 'member-2',
    name: 'Carlos Campos Jr',
    role: 'Full Stack Developer',
    bio: 'Focused on creating seamless user experiences and robust backend systems.',
    // photo: carlosImg,
    pos: { x: 50, y: 50 },
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    id: 'member-3',
    name: 'Jaedon Charles',
    role: 'Backend Developer',
    bio: 'I\'m Jaedon Charles passionate about AI and machine learning, with experience building data-driven solutions and real-world applications.',
    photo: jaedonImg,
    pos: { x: 50, y: 50 },
    github: 'https://github.com/jaedoncharles',
    linkedin: 'https://www.linkedin.com/in/jaedoncharles/',
  },
  {
    id: 'member-4',
    name: 'Carlvensky St. Fleur',
    role: 'Frontend Developer',
    bio: 'Deep passion for design and understanding the world of computers.',
    photo: carlvenskyImg,
    pos: { x: 50, y: 50 },
    github: 'https://github.com/Carlvensky',
    linkedin: 'https://www.linkedin.com/in/carlvensky7/',
  },
  {
    id: 'member-5',
    name: 'Anthony Casas',
    role: 'Role',
    bio: 'Add a short bio here.',
    photo: anthonyImg,
    pos: { x: 50, y: 50 },
    github: 'https://github.com/acasas00',
    linkedin: 'https://www.linkedin.com/in/anthony-casas/',
  },
]

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.522 2 12 2z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const MemberCard = ({ member }) => {
  const initials = member.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="tm-card">
      <div className="tm-portrait-wrap">
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.name}
            className="tm-portrait-img"
            style={{ objectPosition: `${member.pos.x}% ${member.pos.y}%` }}
            draggable={false}
          />
        ) : (
          <div className="tm-portrait-placeholder">
            <span className="tm-initials">{initials}</span>
          </div>
        )}
        <div className="tm-portrait-ring" />
      </div>

      <div className="tm-card-body">
        <h3 className="tm-name">{member.name}</h3>
        <p className="tm-role">{member.role}</p>
        <p className="tm-bio">{member.bio}</p>

        <div className="tm-socials">
          <a href={member.github} target="_blank" rel="noreferrer" className="tm-social-link" aria-label="GitHub">
            <GitHubIcon />
          </a>
          <a href={member.linkedin} target="_blank" rel="noreferrer" className="tm-social-link" aria-label="LinkedIn">
            <LinkedInIcon />
          </a>
        </div>
      </div>
    </div>
  )
}

const TeamPage = () => (
  <div className="team-page">
    <Header />

    <section className="tm-hero">
      <video className="tm-hero-video" src={teamBg} autoPlay muted loop playsInline style={{ objectPosition: `center ${VIDEO_POS_Y}` }} />
      <div className="tm-hero-overlay" />
      <div className="tm-hero-inner">
        <p className="tm-eyebrow">The people behind the product</p>
        <h1 className="tm-hero-heading">Meet the Team</h1>
        <p className="tm-hero-sub">
          Panther Ledger was built by FIU students who wanted a smarter way
          to manage money on campus.
        </p>
      </div>
    </section>

    <section className="tm-grid-section">
      <div className="tm-grid">
        {TEAM_MEMBERS.map(member => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </section>

    <Footer />
  </div>
)

export default TeamPage
