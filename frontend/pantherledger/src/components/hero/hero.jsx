import { Link } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import video1 from '../../assets/FIU/SASC_7.mp4'
import video2 from '../../assets/FIU/Swinging Tables_22.mp4'
import video3 from '../../assets/FIU/Starbucks_4.mp4'
import './hero.css'

const videos = [video1, video2, video3]
const FADE_DURATION = 1500 // ms

const Hero = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [fadingIn, setFadingIn] = useState(false)
  const ref0 = useRef(null)
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const videoRefs = [ref0, ref1, ref2]
  const nextIndex = (activeIndex + 1) % videos.length

  useEffect(() => {
    const activeEl = videoRefs[activeIndex].current
    const nextEl = videoRefs[nextIndex].current

    const handleTimeUpdate = () => {
      if (!activeEl.duration) return
      const timeLeft = activeEl.duration - activeEl.currentTime
      if (timeLeft <= FADE_DURATION / 1000 && !fadingIn) {
        setFadingIn(true)
        nextEl.currentTime = 0
        nextEl.play()
      }
    }

    const handleEnded = () => {
      setActiveIndex(nextIndex)
      setFadingIn(false)
    }

    activeEl.addEventListener('timeupdate', handleTimeUpdate)
    activeEl.addEventListener('ended', handleEnded)
    return () => {
      activeEl.removeEventListener('timeupdate', handleTimeUpdate)
      activeEl.removeEventListener('ended', handleEnded)
    }
  }, [activeIndex, fadingIn])

  return (
    <section className="hero">
      {videos.map((src, i) => (
        <video
          key={src}
          ref={videoRefs[i]}
          className="hero-video"
          muted
          playsInline
          src={src}
          autoPlay={i === 0}
          style={{
            opacity: i === activeIndex ? 1 : fadingIn && i === nextIndex ? 1 : 0,
            transition: i === nextIndex && fadingIn ? `opacity ${FADE_DURATION}ms ease` : 'none',
            zIndex: i === activeIndex ? 0 : fadingIn && i === nextIndex ? 1 : -1,
          }}
        />
      ))}
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
