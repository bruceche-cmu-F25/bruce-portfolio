'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const roles = [
  {
    logo: '/images/agai_logo.png', logoText: undefined, logoAlt: 'CMU AGAI Group',
    org: 'CMU AGAI Group', role: 'Graduate Researcher', date: 'Sep 2026 – Present',
    detail: 'LLM hallucination detection, mitigation, and interpretability.',
  },
  {
    logo: '/images/HelportLogo.jpg', logoText: undefined, logoAlt: 'Helport AI',
    org: 'Helport AI', role: 'AI Product Developer / PM', date: 'Sep 2024 – Jun 2025',
    detail: '20ms responses, 6× lower inference cost, 35% shorter handling time.',
    caseHref: '#work-helport',
  },
  {
    logo: '/images/convoloo_logo.jpeg', logoText: undefined, logoAlt: 'Convoloo',
    org: 'Convoloo', role: 'SDE Intern', date: 'Jul 2024 – Sep 2024',
    detail: 'RAG medical chatbot. Response time 2.5s → 1.5s.',
  },
  {
    logo: null, logoText: 'UCSD', logoAlt: 'UC San Diego',
    org: 'UC San Diego · MATH 20D', role: 'Instructional Assistant', date: 'Sep 2023 – Apr 2024',
    detail: 'Office hours, review sessions, and grading for 100+ students.',
  },
]

export default function Experience() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.exp-row',
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '.exp-list', start: 'top 88%' } })
  }, [])

  return (
    <section id="experience" className="section section-experience" aria-label="Work experience">
      <div className="container">
        <p className="section-kicker">Timeline</p>
        <h2 className="section-heading">Where I&apos;ve Worked</h2>
        <ol className="exp-list">
          {roles.map(role => (
            <li key={role.org} className="exp-row">
              <span className="exp-mark" aria-hidden="true" />
              {role.logo
                ? <img src={role.logo} alt={role.logoAlt} className="exp-logo" />
                : <span className="exp-logo exp-logo-text" aria-label={role.logoAlt}>{role.logoText}</span>}
              <div className="exp-main">
                <h3 className="exp-role">{role.role}</h3>
                <p className="exp-org">{role.org}</p>
                <p className="exp-detail">
                  {role.detail}
                  {role.caseHref && (
                    <>
                      {' '}
                      <a href={role.caseHref} className="exp-case">Case study →</a>
                    </>
                  )}
                </p>
              </div>
              <p className="exp-date">{role.date}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
