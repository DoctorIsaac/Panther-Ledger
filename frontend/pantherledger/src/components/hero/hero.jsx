import { Link } from 'react-router-dom'
import './hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        <h1 className="hero-heading">
          Roar Louder.<br />Spend Smarter!
        </h1>
        <Link to="/signup" className="hero-btn">Get Started</Link>
      </div>
    </section>
  )
}

export default Hero
