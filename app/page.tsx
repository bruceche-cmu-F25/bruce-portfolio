import type { Metadata } from 'next'
import Scene from '@/components/home/Scene'
import Graph from '@/components/home/Graph'
import IsoArt from '@/components/home/Iso'
import Shots from '@/components/home/Shots'
import Trail from '@/components/home/Trail'
import Like from '@/components/home/Like'
import Reveal from '@/components/home/Reveal'
import LogoLoop, { type LogoLoopItem } from '@/components/home/LogoLoop'
import { Glyph } from '@/components/home/Pixels'
import BrandMark from '@/components/home/BrandMark'
import { figures } from '@/components/home/Figures'
import { INTRO, PROJECTS, ROLES, SCHOOLS, SEEKING, SHELVES, STACK, CORE } from '@/lib/home'
import { ALBUMS } from '@/lib/notebook'
import { HOUR_BOOT } from '@/lib/hours'
import { SITE } from '@/lib/siteConfig'
import './home.css'

const TITLE = 'Bruce Cheng · Software Engineer'
const DESCRIPTION = 'San Francisco–based software engineer building AI agents and backends. Open to Bay Area onsite or remote roles from Dec 2026. No visa sponsorship required.'

const TECH_LOGOS: LogoLoopItem[] = [
  { label: 'Python', icon: 'python', core: true },
  { label: 'TypeScript', icon: 'typescript', core: true },
  { label: 'React', icon: 'react', core: true },
  { label: 'Next.js', icon: 'nextjs' },
  { label: 'FastAPI', icon: 'fastapi', core: true },
  { label: 'LangGraph', icon: 'langgraph', core: true },
  { label: 'Docker', icon: 'docker', core: true },
  { label: 'PyTorch', icon: 'pytorch' },
]

const ART_LABELS: Record<string, string> = {
  robin: 'Requests into tasks',
  moon: 'Story & sound',
  deck: 'Spatial search',
  papers: 'Connected research',
  teller: 'Financial assistant',
  chain: 'Pet identity',
}

/** The share preview — re-shoot it with scripts/og-image.sh after the scene changes. */
const PREVIEW = {
  url: '/og.jpg', width: 1200, height: 630,
  alt: 'A painted dusk over San Francisco above the name Bruce Cheng: the Golden Gate lit on the left, the downtown skyline on the right, and a person standing by a parked car on the near hill',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', siteName: 'Bruce Cheng', title: TITLE, description: DESCRIPTION, images: [PREVIEW] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [PREVIEW.url] },
}

const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Bruce Cheng',
  alternateName: 'Chi Cheng',
  url: `${SITE.url}/`,
  image: `${SITE.url}/photos/bruce.webp`,
  email: `mailto:${SITE.email}`,
  description: DESCRIPTION,
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Carnegie Mellon University' },
    { '@type': 'CollegeOrUniversity', name: 'University of California, San Diego' },
  ],
  knowsAbout: ['AI agents', 'LLM applications', 'Backend engineering', 'Full-stack development', 'Python', 'TypeScript', 'FastAPI', 'LangGraph'],
  sameAs: [SITE.linkedin, SITE.github],
}

/** Turns the `[text](href)` in an intro paragraph into real anchors, and the
 *  figures in the prose around them into marked-up numbers. */
function linked(text: string) {
  return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (!m) return <span key={i}>{figures(part)}</span>
    const external = /^https?:/.test(m[2])
    return <a key={i} href={m[2]} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{m[1]}</a>
  })
}

/** An organisation's logo, redrawn in its own colours as dither by
 *  scripts/make-logos.mjs, every one fitted to the same box so the symbols
 *  stand the same height and the wordmark spans the column. */
function Mark({ name, className }: { name: string; className?: string }) {
  return <span className={`mark ${className ?? ''}`} style={{ backgroundImage: `url(/logos/color/${name}.png)` }} aria-hidden />
}

const STATUS_LABEL = { live: 'Live', dev: 'In progress', archive: 'Archived' } as const

function Section({ id, title, children, aside }: { id: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="sec" id={id} data-reveal>
      <h2 className="sec-head">
        <span className="sec-ramp" aria-hidden>░▒▓</span>
        <a href={`#${id}`}>{title}</a>
        {aside && <span className="sec-aside">{aside}</span>}
      </h2>
      {children}
    </section>
  )
}

export default function Page() {
  return (
    <main className="page">
      {/* colours the page for the visitor's hour before the first paint */}
      <script dangerouslySetInnerHTML={{ __html: HOUR_BOOT }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
      {/* WeChat takes the first large image in the page when a link is pasted into a chat */}
      <img src={PREVIEW.url} alt="" hidden width={PREVIEW.width} height={PREVIEW.height} />

      <Trail />
      <Reveal />

      <div className="frame">
        <Scene />

        <header className="who" id="about">
          {/* Bruce's own dithered photograph, untouched — only a colour filter
              moves, so the face warms and cools with the painting above it */}
          <span className="who-pic">
            <img src="/photos/bruce-portrait.webp" width={578} height={578}
                 alt="Bruce Cheng, in a dithered photograph" />
            <span className="who-tint" aria-hidden="true" />
          </span>
          <div className="who-name">
            <h1>{INTRO.name}</h1>
            <p>{INTRO.role}</p>
            <ul className="who-details" aria-label="Location and work availability">
              {SEEKING.where.map(detail => <li key={detail}>{detail}</li>)}
            </ul>
          </div>
          <p className="who-place"><i aria-hidden /> Open to work · {SEEKING.from}</p>
        </header>

        <div className="actions">
          <a className="btn" href={`mailto:${SITE.email}`}>
            <Glyph name="mail" /> Send an email
          </a>
          <a className="btn" href={SITE.resume} download>
            <Glyph name="down" /> Résumé (PDF)
          </a>
          <span className="actions-thin">
            <a className="actions-github" href={SITE.github} target="_blank" rel="noopener noreferrer"><BrandMark name="github" /> GitHub profile <Glyph name="out" /></a>
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer"><BrandMark name="linkedin" /> LinkedIn <Glyph name="out" /></a>
          </span>
        </div>

        <div className="intro">
          {INTRO.paragraphs.map((p, i) => <p key={i}>{linked(p)}</p>)}
        </div>

        <Graph />

        <Section id="experience" title="Where I've Worked">
          <ol className="roles">
            {ROLES.map(r => (
              <li key={r.org}>
                <span className="role-logo" data-wide={'wide' in r ? true : undefined}>
                  <Mark name={r.mark} />
                </span>
                <div className="role-body">
                  <p className="role-line"><b>{r.role}</b> <span>{r.org}</span></p>
                  <p className="role-detail">{figures(r.detail)}</p>
                </div>
                <p className="role-date">{r.date}</p>
              </li>
            ))}
          </ol>
          <ul className="schools">
            {SCHOOLS.map(s => (
              <li key={s.school}>
                <Mark name={s.mark} className="school-mark" />
                <p><b>{s.school}</b><span>{s.degree} · {s.date}</span></p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="built" title="What I've Built" aside="six selected projects">
          <div className="grid">
            {/* Each card is an article with one real link, stretched over the
                whole card by CSS. The like button sits above that stretch, which
                is the only way to have a button on a clickable card — a button
                inside an <a> isn't valid HTML, and browsers handle it badly. */}
            {PROJECTS.map((p, index) => {
              return (
                <article key={p.key} id={p.key} className="card" data-status={p.status}
                         data-link={p.href ? true : undefined}
                         style={{ ['--d' as string]: `${(index % 2) * 80 + Math.floor(index / 2) * 110}ms` }}>
                  <span className="card-art">
                    <Shots index={String(index + 1).padStart(2, '0')} label={ART_LABELS[p.art]} title={p.title} shots={p.shots}>
                      <IsoArt art={p.art} />
                    </Shots>
                  </span>
                  <span className="card-head">
                    <b>{p.title}</b>
                    <em data-status={p.status}><i aria-hidden /> {STATUS_LABEL[p.status]}</em>
                  </span>
                  <span className="card-meta">{p.kind} · {p.when}</span>
                  <span className="card-blurb">{p.blurb}</span>
                  <span className="card-facts">{p.facts.map(f => <i key={f}>{figures(f)}</i>)}</span>
                  <span className="card-tags">{p.tags.map(t => <i key={t}>{t}</i>)}</span>
                  <span className="card-go">
                    {p.href
                      ? <a className="card-link" href={p.href} target="_blank" rel="noopener noreferrer"
                           aria-label={`${p.title} — ${p.linkKind === 'repo' ? 'read the source' : 'open the live site'}`}>
                          {p.linkKind === 'repo' ? <BrandMark name="github" /> : <Glyph name="out" />} {p.linkKind === 'repo' ? 'Read the source' : 'Open the live site'}
                        </a>
                      : <a className="card-link" href={`mailto:${SITE.email}?subject=${encodeURIComponent(`About ${p.title}`)}`}
                           aria-label={`Ask Bruce about ${p.title} by email`}>
                          <Glyph name="mail" /> Ask me about it
                        </a>}
                    <Like id={p.key} title={p.title} seed={p.likes} />
                  </span>
                </article>
              )
            })}
          </div>
        </Section>

        <Section id="stack" title="Tech Stack">
          <LogoLoop logos={TECH_LOGOS} ariaLabel="Selected tools in Bruce's technology stack" />
          <dl className="stack">
            {STACK.map(row => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.items.map(t => <span key={t} data-core={CORE.has(t) || undefined}>{t}</span>)}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="life" title="Life &amp; Interests" aside="what I read, play and watch between builds">
          <div className="shelves">
            {SHELVES.map(s => (
              <div key={s.label} className="shelf">
                <p className="shelf-label">{s.label}</p>
                <ul>
                  {ALBUMS[s.album].slice(0, 7).map(p => (
                    <li key={p.src} className="cel">
                      <img src={p.src} alt={p.alt} loading="lazy" />
                      <i className="cel-scan" aria-hidden />
                      <i className="cel-name">{(p.caption ?? '').split(' · ')[0]}</i>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="contact" title="Let's Work Together">
          <div className="seek">
            <p className="seek-label">looking for · from {SEEKING.from}</p>
            <p className="seek-roles">{SEEKING.roles.map(r => <span key={r}>{r}</span>)}</p>
            <p className="seek-where">{SEEKING.where.join(' · ')}</p>
          </div>
          <dl className="contact">
            <div><dt><Glyph name="mail" /> email</dt><dd><a href={`mailto:${SITE.email}`}>{SITE.email}</a></dd></div>
            <div><dt><BrandMark name="linkedin" /> LinkedIn</dt><dd><a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">{SITE.linkedinHandle}</a></dd></div>
            <div><dt><BrandMark name="github" /> GitHub</dt><dd><a href={SITE.github} target="_blank" rel="noopener noreferrer">{SITE.githubHandle}</a></dd></div>
            <div><dt><Glyph name="phone" /> phone</dt><dd><a href={SITE.phoneHref}>{SITE.phone}</a></dd></div>
            <div><dt><Glyph name="down" /> résumé</dt><dd><a href={SITE.resume} download>PDF</a></dd></div>
          </dl>
        </Section>

        <footer className="foot">
          <p>© 2026 Bruce Cheng</p>
          <p className="foot-links">
            <a href="/notebook/">the notebook</a>
            <a href="/robin/">the space site</a>
          </p>
        </footer>
      </div>
    </main>
  )
}
