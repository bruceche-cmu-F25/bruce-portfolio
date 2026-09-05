'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rows = [
  { label: 'Languages & Backend', pills: ['Python','Java','C/C++','JavaScript','TypeScript','Go','FastAPI','Flask','Node.js','Express.js','MySQL','MongoDB'] },
  { label: 'Cloud & DevOps',      pills: ['AWS','GCP','Docker','Kubernetes','Terraform','CI/CD','GKE'] },
  { label: 'AI / ML',             pills: ['LangGraph','LangChain','RAG','LLM APIs','OpenAI API','Vertex AI','PyTorch','TensorFlow','Hugging Face','vLLM','Milvus'] },
  { label: 'Frontend & Tools',    pills: ['React','Next.js','Streamlit','Figma','Git','Agile/Scrum'] },
]

export default function Stack() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.utils.toArray<HTMLElement>('.stack-row').forEach((row, i) => {
      gsap.fromTo(row,
        { x: -28, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.6, delay: i * 0.05, ease: 'power3.out',
          scrollTrigger: { trigger: row, start: 'top 91%' } })
    })
  }, [])

  return (
    <section id="stack" className="section section-alt" aria-label="Technology stack">
      <div className="container">
        <p className="section-kicker">Technologies</p>
        <h2 className="section-heading">Tech Stack</h2>
        <div className="stack-grid">
          {rows.map(({ label, pills }) => (
            <div key={label} className="stack-row">
              <span className="stack-label">{label}</span>
              <div className="stack-pills">
                {pills.map(p => <span key={p}>{p}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
