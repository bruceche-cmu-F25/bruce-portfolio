'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const hobbies = [
  { icon: '📚', name: 'Reading',     desc: 'Tech, philosophy, and personal growth.' },
  { icon: '🎮', name: 'Gaming',      desc: 'Strategy and puzzle games.' },
  { icon: '✈️', name: 'Travel',      desc: 'Exploring new places and cultures.' },
  { icon: '📷', name: 'Photography', desc: 'Capturing moments through photos.' },
  { icon: '🏃', name: 'Fitness',     desc: 'Running and staying active.' },
  { icon: '🎵', name: 'Music',       desc: 'Discovering new music.' },
  { icon: '🎨', name: 'Drawing',     desc: 'Sketching and digital art.' },
  { icon: '💻', name: 'New Tech',    desc: 'Keeping up with what\'s next.' },
]

export default function Life() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.hobby-card',
      { y: 36, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: 'back.out(1.5)',
        scrollTrigger: { trigger: '.hobbies-grid', start: 'top 88%' } })
    gsap.fromTo('.artwork-block, .mbti-block',
      { y: 28, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: '.life-showcase', start: 'top 88%' } })
  }, [])

  return (
    <section id="life" className="section" aria-label="Life and interests">
      <div className="container">
        <p className="section-kicker">Beyond Code</p>
        <h2 className="section-heading">Life &amp; Interests</h2>
        <div className="hobbies-grid">
          {hobbies.map(h => (
            <div key={h.name} className="hobby-card">
              <div className="hobby-icon">{h.icon}</div>
              <h3>{h.name}</h3>
              <p>{h.desc}</p>
            </div>
          ))}
        </div>
        <div className="life-showcase">
          <div className="artwork-block">
            <p className="section-kicker">Artwork</p>
            <h3 className="life-subheading">Digital Art</h3>
            <div className="artwork-grid">
              <figure className="artwork-card">
                <img src="/Gwen.PNG" alt="Gwen-inspired digital artwork by Bruce Cheng" loading="lazy" />
              </figure>
              <figure className="artwork-card">
                <img src="/IMG_2629.PNG" alt="Sci-fi inspired digital artwork by Bruce Cheng" loading="lazy" />
              </figure>
            </div>
          </div>
          <div className="mbti-block">
            <p className="section-kicker">Personality</p>
            <h3 className="life-subheading">MBTI Snapshot</h3>
            <p className="mbti-desc">Campaigner (ENFP-A) — creative, people-oriented, and driven by possibility.</p>
            <figure className="mbti-card">
              <img src="/images/MBTI.png" alt="MBTI personality result — ENFP-A Campaigner" loading="lazy" />
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
