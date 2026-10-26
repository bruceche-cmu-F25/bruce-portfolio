import { SITE } from '@/lib/siteConfig'

const proofs = [
  { name: 'Helport AI', text: 'Production call assistant. 20ms responses, 6× lower inference cost, 35% shorter handling time.' },
  { name: 'Robin', text: 'A personal agent registered with a fixed tool allow-list, not a shell.' },
  { name: 'CMU AGAI', text: 'Research on detecting and explaining LLM hallucinations.' },
]

const schools = [
  'MS Software Engineering · Carnegie Mellon · Silicon Valley · GPA 3.6 · Dec 2026',
  'BS Mathematics–Computer Science · UC San Diego · GPA 3.6 · Apr 2025',
]

export default function About() {
  return (
    <section id="about" className="section" aria-label="About Bruce Cheng">
      <div className="container">
        <p className="section-kicker">About</p>
        <h2 className="about-heading">Full-time software<br />roles, Dec 2026</h2>
        <p className="about-body">MS in Software Engineering at CMU Silicon Valley. I build agentic systems, and the backends that keep them fast.</p>
        <ul className="about-proofs">
          {proofs.map(item => (
            <li key={item.name}><strong>{item.name}</strong> — {item.text}</li>
          ))}
        </ul>
        <ul className="about-edu">
          {schools.map(line => <li key={line}>{line}</li>)}
        </ul>
        <div className="about-links">
          <a href={SITE.github} target="_blank" rel="noopener" className="about-link">GitHub ↗</a>
          <a href={SITE.linkedin} target="_blank" rel="noopener" className="about-link">LinkedIn ↗</a>
          <a href={SITE.resume} download className="about-link">Resume ↓</a>
        </div>
      </div>
    </section>
  )
}
