'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SITE } from '@/lib/siteConfig'

export default function Contact() {
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.contact-cards',
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-cards', start: 'top 89%' } })
    gsap.fromTo('.contact-form',
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-form', start: 'top 91%' } })
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = formRef.current!
    const name    = (form.elements.namedItem('name')    as HTMLInputElement).value
    const email   = (form.elements.namedItem('email')   as HTMLInputElement).value
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value
    if (!name || !email || !message) { alert('Please fill in all fields'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Please enter a valid email address'); return }
    setSubmitting(true)
    const subject = encodeURIComponent(`Contact from ${name}`)
    const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`
    setTimeout(() => {
      form.reset()
      setSubmitting(false)
    }, 1000)
  }

  return (
    <section id="contact" className="section section-contact" aria-label="Contact Bruce Cheng">
      <div className="contact-glow" aria-hidden="true" />
      <div className="container">
        <p className="section-kicker">Get In Touch</p>
        <h2 className="contact-heading">Let&apos;s Work<br />Together</h2>
        <p className="contact-sub">Open to internships, collaborations, and interesting conversations.</p>
        <div className="contact-cards">
          <a href={`mailto:${SITE.email}`} className="contact-card">
            <span className="contact-icon">📧</span>
            <span className="contact-label">Email</span>
            <span className="contact-value">{SITE.email}</span>
          </a>
          <a href={SITE.linkedin} target="_blank" rel="noopener" className="contact-card">
            <span className="contact-icon">💼</span>
            <span className="contact-label">LinkedIn</span>
            <span className="contact-value">{SITE.linkedinHandle}</span>
          </a>
          <a href={SITE.github} target="_blank" rel="noopener" className="contact-card">
            <span className="contact-icon">💻</span>
            <span className="contact-label">GitHub</span>
            <span className="contact-value">{SITE.githubHandle}</span>
          </a>
          <a href={SITE.phoneHref} className="contact-card">
            <span className="contact-icon">📱</span>
            <span className="contact-label">Phone</span>
            <span className="contact-value">{SITE.phone}</span>
          </a>
        </div>
        <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" required placeholder="Your name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="your@email.com" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} required placeholder="What's on your mind?" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Opening mail…' : 'Send Message →'}
          </button>
        </form>
      </div>
    </section>
  )
}
