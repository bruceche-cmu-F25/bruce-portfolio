/** Every page of the notebook, in book order. Rendered once as static HTML;
 *  Notebook clones these nodes into page-flip, so nothing here may rely on
 *  React state or event handlers — links between pages carry `data-goto`, the
 *  index of the spread they open. */

import type { ReactNode } from 'react'
import { bentoDetails } from '@/lib/bentoData'
import { SITE } from '@/lib/siteConfig'
import { SPREADS, ALBUMS, spreadOf, type Card, type Note, type Main } from '@/lib/notebook'
import { Diagram, Circled, Glyph, TraitBars, Stat, Rosette, PaperPlane, ink, stress } from './Ink'
import { Sticker, Doodle, Decal } from './Sticker'
import { Logo } from './Logo'
import { CardFace, DECK, cardLabel, cardTitle } from './Cards'

/** Page numbers count the content pages only: About is 1, Contact is 13 —
 *  ace to king, as the cards tucked into their corners show. */
const folio = (spread: number) => spread + 1

function Page({ kind, side, folio: n, slug, children }: {
  kind: 'note' | 'main'; side: 'left' | 'right'; folio?: number; slug?: string; children: ReactNode
}) {
  return (
    <div className={`nb-page nb-${side}`} data-kind={kind} data-slug={slug}>
      <div className="nb-sheet">
        {children}
        {n !== undefined && <PageCard n={n} />}
      </div>
    </div>
  )
}

/** The page number: a playing card, tucked into the corner. Pick it up to look at it. */
function PageCard({ n }: { n: number }) {
  return (
    <figure className="nb-pcard" style={{ ['--tilt' as string]: `${DECK[n - 1].tilt}deg` }}>
      <CardFace n={n} />
      <Lift zoom={`card:${n}`} label={`page ${n} — the ${cardLabel(n)}`} />
    </figure>
  )
}

/** A link to another page of the book. */
function Goto({ to, children }: { to: string; children: ReactNode }) {
  return <a href={`#${to}`} data-goto={spreadOf(to)} className="nb-goto">{children}</a>
}

function Out({ href, children, download }: { href: string; children: ReactNode; download?: boolean }) {
  return download
    ? <a href={href} download>{children} <Glyph ch="↓" /></a>
    : <a href={href} target="_blank" rel="noopener">{children} <Glyph ch="↗" /></a>
}

/* ── Covers ───────────────────────────────────────────────────────── */

/** Where each sticker sits on the front cover, laptop-lid style: % of the cover, size in units, tilt. */
const ON_THE_COVER: { x: string; y: string; w: number; r: number; art: ReactNode }[] = [
  // the cover's first arrangement, with today's stickers in its places
  { x: '6%',  y: '6%',  w: 128, r: -12, art: <Decal kind="blackhole" label="A black hole" /> },
  { x: '69%', y: '8%',  w: 140, r: 11,  art: <Decal kind="bat" label="The bat-signal" /> },
  { x: '8%',  y: '46%', w: 132, r: -9,  art: <Decal kind="docker" label="The Docker logo" /> },
  { x: '26%', y: '61%', w: 108, r: 7,   art: <Decal kind="neural" label="A small neural network" /> },
  { x: '57%', y: '49%', w: 116, r: 6,   art: <Decal kind="pi" label="The Pi logo" /> },
  { x: '65%', y: '69%', w: 100, r: 14,  art: <Decal kind="robot" label="A robot" /> },
  { x: '9%',  y: '79%', w: 92,  r: -10, art: <Decal kind="python" label="The Python logo" /> },
  { x: '43%', y: '77%', w: 88,  r: -6,  art: <Decal kind="react" label="The React logo" /> },
]

function FrontCover() {
  return (
    <div className="nb-page nb-cover nb-cover-front" data-density="hard" data-kind="cover">
      <div className="nb-sheet">
        <div className="nb-label">
          <p className="nb-label-name">Bruce Cheng</p>
          <p className="nb-label-line">notebook · 2026</p>
          <p className="nb-label-small">MS Software Engineering · Carnegie Mellon</p>
        </div>
        {ON_THE_COVER.map((s, i) => (
          <span key={i} className="nb-on-cover"
                style={{ ['--x' as string]: s.x, ['--y' as string]: s.y, ['--w' as string]: s.w, ['--r' as string]: `${s.r}deg` }}>
            {s.art}
          </span>
        ))}
        <p className="nb-cover-hint">open me <Glyph ch="→" /></p>
      </div>
    </div>
  )
}

/** The deck, fanned out on the back cover: a card back for every page not yet
 *  read — tap it to go and collect it — and the card itself once it has been.
 *  Notebook turns the backs over as the pages are read (see collect there). */
function Deck() {
  return (
    <div className="nb-deck">
      <p className="nb-deck-title">the deck</p>
      <div className="nb-deck-fan">
        {DECK.map((_, i) => (
          <span key={i} className="nb-deck-slot" data-card={i + 1} style={{ ['--i' as string]: i - (DECK.length - 1) / 2 }}>
            <button type="button" className="nb-deck-back" data-goto={i}
                    aria-label={`${cardTitle(i + 1)}, not collected yet — turn to page ${i + 1}, ${SPREADS[i].label}`} />
          </span>
        ))}
      </div>
      <p className="nb-deck-count"><span className="nb-deck-n">0</span> / {DECK.length} collected</p>
      <p className="nb-deck-hint">every page has a card — read them all</p>
      <button type="button" className="nb-deck-replay" data-cascade hidden>deal them out again</button>
    </div>
  )
}

function BackCover() {
  return (
    <div className="nb-page nb-cover nb-cover-back" data-density="hard" data-kind="cover">
      <div className="nb-sheet">
        <Deck />
        <div className="nb-label nb-label-return">
          <p className="nb-label-line">if found, please return to</p>
          <p className="nb-label-name nb-label-name-sm">Bruce Cheng</p>
          <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        </div>
        <button type="button" className="nb-restart" data-restart aria-label="Start over from the front cover">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.4 13.2A7.6 7.6 0 1 1 16.9 6.3" />
            <path d="M17.6 2.6L17.2 6.8L13 6.6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ── Pictures: tipped in like cards, and lifted off the page on a click ── */

/** The button lies over the whole card: page-flip lets a click on a <button>
 *  through instead of turning the page, and Notebook opens the album from it. */
function Lift({ zoom, label }: { zoom: string; label: string }) {
  return <button type="button" className="nb-lift" data-zoom={zoom} aria-label={`Enlarge: ${label}`} />
}

function Picture({ card, className = '' }: { card: Card; className?: string }) {
  if (card.pile) return <Pile card={card} className={className} />
  const index = card.index ?? 0
  const pic = ALBUMS[card.album][index]
  return (
    <figure className={`nb-card ${className}`} data-tape={card.tape}
            style={{ ['--tilt' as string]: `${card.tilt ?? -1}deg` }}>
      <img src={pic.src} alt={pic.alt} />
      {card.caption && <figcaption>{card.caption}</figcaption>}
      <Lift zoom={`${card.album}:${index}`} label={pic.alt} />
    </figure>
  )
}

/** An album as a loose pile: the top picture taped down, the others showing at
 *  its edges. Lifted, it opens as the same pile, which a hand leafs through. */
function Pile({ card, className = '' }: { card: Card; className?: string }) {
  const pics = ALBUMS[card.album]
  const top = card.index ?? 0
  const under = [1, 2].map(d => pics[(top + d) % pics.length]).slice(0, pics.length - 1)
  return (
    <figure className={`nb-pile ${className}`} style={{ ['--tilt' as string]: `${card.tilt ?? -1}deg` }}>
      <div className="nb-pile-stack">
        {under.reverse().map((p, i) => (
          <div key={p.src} className={`nb-pile-sheet nb-pile-under nb-pile-d${under.length - i}`}>
            <img src={p.src} alt="" />
          </div>
        ))}
        <div className="nb-pile-sheet nb-card" data-tape={card.tape}>
          <img src={pics[top].src} alt={pics[top].alt} />
        </div>
      </div>
      {card.caption && <figcaption>{card.caption}</figcaption>}
      <Lift zoom={`${card.album}:${top}`} label={`${pics[top].alt} — and ${pics.length - 1} more`} />
    </figure>
  )
}

/** Where each cover of a collage was stuck down: its corner and width as % of
 *  the collage, and its tilt. Later ones overlap earlier ones. */
type Spot = { x: number; y: number; w: number; r: number }
const COLLAGES: Record<string, { ratio: string; spots: Spot[] }> = {
  posters: {
    ratio: '10 / 8.8',
    spots: [
      { x: 1,  y: 2,  w: 28, r: -5 }, { x: 35, y: 0,  w: 28, r: 3 },  { x: 70, y: 4,  w: 28, r: -2 },
      { x: 4,  y: 49, w: 28, r: 4 },  { x: 38, y: 46, w: 28, r: -6 }, { x: 71, y: 50, w: 27, r: 5 },
      { x: 52, y: 25, w: 27, r: 9 },
    ],
  },
  games: {
    ratio: '600 / 196',
    spots: [
      { x: 0,  y: 6,  w: 14,   r: -4 }, { x: 11, y: 30, w: 27, r: 3 },  { x: 36, y: 2,  w: 15.5, r: -3 },
      { x: 49, y: 24, w: 14,   r: 5 },  { x: 61, y: 4,  w: 12.5, r: -6 }, { x: 71, y: 33, w: 15, r: 4 },
      { x: 86, y: 8,  w: 12.5, r: -2 },
    ],
  },
  books: {
    ratio: '300 / 176',
    spots: [{ x: 0, y: 6, w: 33, r: -5 }, { x: 32, y: 0, w: 35, r: 3 }, { x: 66, y: 9, w: 33, r: -2 }],
  },
}

/** An album as small covers, each liftable on its own — in a row, or stuck
 *  down every which way, overlapping, when it has a collage. */
function Shelf({ album, className = '' }: { album: string; className?: string }) {
  const tilts = [-2.5, 1.8, -1.2, 2.6, -2, 1.4]
  const tapes = ['yellow', 'blue', 'pink'] as const
  const collage = COLLAGES[album]
  return (
    <div className={`nb-shelf nb-shelf-${album}${collage ? ' nb-collage' : ''} ${className}`}
         style={collage ? { aspectRatio: collage.ratio } : undefined}>
      {ALBUMS[album].map((p, i) => {
        const spot = collage?.spots[i]
        return (
          <figure key={p.src} className="nb-card nb-mini" data-tape={tapes[i % tapes.length]}
                  style={spot
                    ? { left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, ['--tilt' as string]: `${spot.r}deg` }
                    : { ['--tilt' as string]: `${tilts[i % tilts.length]}deg` }}>
            <img src={p.src} alt={p.alt} />
            <Lift zoom={`${album}:${i}`} label={p.alt} />
          </figure>
        )
      })}
    </div>
  )
}

/* ── Notes: what's written beside a page ──────────────────────────── */

function Contents() {
  let grouped = false
  return (
    <div className="nb-col">
      <h2 className="nb-h nb-h-toc">contents</h2>
      <ol className="nb-toc">
        {SPREADS.map((s, i) => {
          const opensGroup = s.group === 'work' && !grouped
          if (opensGroup) grouped = true
          return (
            <li key={s.slug} className={s.group ? 'nb-toc-sub' : undefined}>
              {opensGroup && <span className="nb-toc-group">What I&apos;ve Built</span>}
              <a href={`#${s.slug}`} data-goto={i}>
                <span className="nb-toc-label">{s.label}</span>
                <span className="nb-toc-dots" />
                <span className="nb-toc-num">{folio(i)}</span>
              </a>
            </li>
          )
        })}
      </ol>
      <p className="nb-toc-hint">
        <span className="nb-on-desk">scroll, drag a page corner, or use <Glyph ch="→" /> on your keyboard</span>
        <span className="nb-on-phone">swipe sideways to turn the page; scroll down when there&apos;s more</span>
      </p>
    </div>
  )
}

function NoteBody({ note }: { note: Note }) {
  return (
    <div className="nb-col">
      {note.quote && (
        <blockquote className="nb-quote">
          <p>{note.quote.text}</p>
          <footer>— {note.quote.who}, <cite>{note.quote.source}</cite></footer>
        </blockquote>
      )}
      {note.memo && <p className="nb-memo">{note.memo}</p>}
      {note.logo && (
        <figure className="nb-card nb-badge-card" data-tape="blue">
          <img src={note.logo.src} alt={note.logo.alt} />
        </figure>
      )}
      {note.stat && <Stat big={note.stat.big} small={note.stat.small} seed={note.stat.big.length * 13} />}
      {note.award && (
        <div className="nb-award">
          <Rosette place={note.award.place} />
          <p>{note.award.text}</p>
        </div>
      )}
      {note.facts && (
        <ul className="nb-facts">
          {note.facts.map(f => <li key={f}>{ink(f)}</li>)}
        </ul>
      )}
      {note.card && <Picture card={note.card} />}
      {note.link && (
        <p className="nb-links"><Out href={note.link.href} download={note.link.download}>{note.link.label}</Out></p>
      )}
      {note.shelf && <Shelf album={note.shelf} />}
      {note.traits && (
        <div className="nb-traits-box">
          <p className="nb-traits-title">{note.traits.title} <span>· {note.traits.source}</span></p>
          <TraitBars traits={note.traits} />
        </div>
      )}
      {note.plane && <PaperPlane />}
    </div>
  )
}

/** The note for one spread — a page of its own on a phone, the strip on a desktop. */
export function Notes({ spread }: { spread: number }) {
  const note = SPREADS[spread].note
  return note === 'contents' ? <Contents /> : <NoteBody note={note} />
}

/* ── Content pages ────────────────────────────────────────────────── */

function Head({ kicker, title, sub, big }: { kicker: string; title: ReactNode; sub?: ReactNode; big?: boolean }) {
  return (
    <header className="nb-head">
      <p className="nb-kicker">{kicker}</p>
      <h2 className={big ? 'nb-h nb-h-big' : 'nb-h'}>{title}</h2>
      {sub && <p className="nb-sub">{sub}</p>}
    </header>
  )
}

function ToContents() {
  return <a href="#about" data-goto={0} className="nb-tocback">contents</a>
}

/** The roles and places Bruce is looking for — in Bruce's words, Oct 2026. */
const SEEKING = {
  roles: ['Forward Deployed Engineer', 'AI / agent engineering', 'Full-stack', 'New-grad SWE'],
  where: 'Bay Area · remote · open to relocate',
}

function About() {
  return (
    <>
      <Picture card={{ album: 'me', caption: ALBUMS.me[0].caption, tilt: 3.5, tape: 'yellow' }} className="nb-polaroid" />
      <Head big kicker="about" title="Bruce Cheng" sub={<>New-grad software engineer, available <Circled>Dec 2026</Circled></>} />
      <p className="nb-lead">MS in Software Engineering at CMU Silicon Valley. I build agentic systems, and the backends that keep them fast.</p>
      <div className="nb-seeking">
        <p className="nb-seeking-label">looking for</p>
        <p className="nb-seeking-roles">{SEEKING.roles.map(r => <span key={r}>{r}</span>)}</p>
        <p className="nb-seeking-where">{SEEKING.where}</p>
      </div>
      <ul className="nb-list">
        <li><Goto to="helport">Helport AI</Goto> {stress('— production call assistant. 6× lower inference cost, 35% shorter handling time.')}</li>
        <li><Goto to="robin">Robin</Goto> — a personal AI workbench with a lasting working context, one that helps you act.</li>
        <li><Goto to="experience">CMU AGAI</Goto> — research on detecting and explaining LLM hallucinations.</li>
      </ul>
      <ul className="nb-schools">
        <li>
          <span className="nb-seal" style={{ ['--seal-tilt' as string]: '5deg' }}>
            <img src="/images/cmu-seal.webp" alt="Seal of Carnegie Mellon University" />
          </span>
          <p className="nb-school">Carnegie Mellon University · Silicon Valley<span>MS Software Engineering · GPA 3.6 · Dec 2026</span></p>
        </li>
        <li>
          <span className="nb-seal" style={{ ['--seal-tilt' as string]: '-6deg' }}>
            <img src="/images/ucsd-seal.webp" alt="Seal of the University of California, San Diego" />
          </span>
          <p className="nb-school">UC San Diego<span>BS Mathematics–Computer Science · GPA 3.6 · Mar 2025</span></p>
        </li>
      </ul>
      <div className="nb-about-foot">
        <p className="nb-links">
          <span className="nb-linked"><Logo kind="email" href={`mailto:${SITE.email}`} label="Email" /><a href={`mailto:${SITE.email}`}>{SITE.email}</a></span>
          <span className="nb-linked"><Logo kind="github" href={SITE.github} label="GitHub" /><Out href={SITE.github}>GitHub</Out></span>
          <span className="nb-linked"><Logo kind="linkedin" href={SITE.linkedin} label="LinkedIn" /><Out href={SITE.linkedin}>LinkedIn</Out></span>
          <span className="nb-linked"><Logo kind="resume" href={SITE.resume} label="Resume (PDF)" download /><Out href={SITE.resume} download>Resume</Out></span>
        </p>
      </div>
    </>
  )
}

/** Each role, with its organisation's logo; Helport's is a wordmark, so it's laid out wide. */
const ROLES: { org: string; role: string; date: string; logo: string; wide?: true; detail: string; page?: string }[] = [
  { org: 'CMU AGAI Group', role: 'Graduate Researcher', date: 'Sep 2026 – Present', logo: '/logos/agai.webp',
    detail: 'Identified and resolved flaws in LLM hallucination-detection experiments, improving detection precision by 6 percentage points through systematic evaluation and debugging.' },
  { org: 'Helport AI', role: 'AI Product Developer / PM', date: 'Sep 2024 – Jun 2025', logo: '/logos/helport.webp', wide: true,
    detail: '6× lower inference cost, 35% shorter handling time.', page: 'helport' },
  { org: 'Convoloo', role: 'Software Engineer Intern', date: 'Jul 2024 – Sep 2024', logo: '/logos/convoloo.webp',
    detail: 'RAG medical chatbot. Response time 2.5s → 1.5s.' },
  { org: 'UC San Diego · MATH 20D', role: 'Instructional Assistant', date: 'Sep 2023 – Apr 2024', logo: '/images/ucsd-seal.webp',
    detail: 'Office hours, review sessions, and grading.' },
]

function Experience() {
  return (
    <>
      <Head kicker="timeline" title="Where I've Worked" />
      <ol className="nb-timeline">
        {ROLES.map(r => (
          <li key={r.org}>
            <span className="nb-card nb-tl-logo" data-wide={r.wide}><img src={r.logo} alt={r.org} /></span>
            <p className="nb-tl-date">{r.date}</p>
            <p className="nb-tl-role">{r.role}</p>
            <p className="nb-tl-org">{r.org}</p>
            <p className="nb-tl-detail">
              {stress(r.detail)}
              {r.page && <> <Goto to={r.page}>see p.{folio(spreadOf(r.page))}</Goto></>}
            </p>
          </li>
        ))}
      </ol>
    </>
  )
}

/** A project's sketch. Its seed is fixed per spread, so the enlarged copy draws the same wobble. */
export const diagramSeed = (spread: number) => (spread + 1) * 97

function Project({ main, spread }: { main: Extract<Main, { kind: 'project' }>; spread: number }) {
  const e = bentoDetails[main.key]
  const title = main.heading ?? e.title
  return (
    <>
      <Head kicker={`${e.type.toLowerCase()} · ${e.date}`} title={title}
            sub={main.heading && main.heading !== e.title ? `${e.title} · ${e.org}` : e.org} />
      {main.sticker && (e.demo || e.repo) && (
        <Sticker spec={main.sticker} href={(e.demo || e.repo)!}
                 title={`${title} — ${e.demo ? 'open the live site' : 'source on GitHub'}`} />
      )}
      {main.lead && <p className="nb-lead">{main.lead}</p>}
      <figure className="nb-card nb-card-diagram" style={{ ['--tilt' as string]: `${spread % 2 ? 0.7 : -0.8}deg` }}>
        <Diagram spec={main.diagram} seed={diagramSeed(spread)} title={`How ${title} fits together`} />
        <Lift zoom={`diagram:${spread}`} label={`how ${title} fits together`} />
      </figure>
      <ul className="nb-list nb-points">
        {main.points.map(p => <li key={p}>{stress(typeof p === 'string' ? p : e.points[p])}</li>)}
      </ul>
      <p className="nb-metrics">
        {(main.metrics ?? e.metrics.map(m => m.label)).map(m => <span key={m}>{ink(m)}</span>)}
      </p>
      {main.tags !== false && <p className="nb-tags">{e.tags.join(' · ')}</p>}
      {(e.demo || e.repo) && (
        <p className="nb-links">
          {e.demo && <Out href={e.demo}>live demo</Out>}
          {e.repo && <Out href={e.repo}>source</Out>}
        </p>
      )}
    </>
  )
}

/** Short rules, each led by a phrase gone over in highlighter. */
function Principles({ main }: { main: Extract<Main, { kind: 'principles' }> }) {
  return (
    <>
      <Head kicker={main.kicker} title={main.title} />
      <ol className="nb-rules">
        {main.items.map(r => (
          <li key={r.lead}><span className="nb-rule-lead">{r.lead}</span> {ink(r.text)}</li>
        ))}
      </ol>
    </>
  )
}

/** The tools the work leans on most are written bigger. */
const CORE = new Set(['Python', 'TypeScript', 'FastAPI', 'LangGraph', 'React', 'Docker'])

const STACK = [
  { label: 'Languages', items: ['Python', 'TypeScript', 'JavaScript'] },
  { label: 'Backend',   items: ['FastAPI', 'Flask', 'Node.js', 'Express.js', 'NestJS', 'MySQL'] },
  { label: 'Cloud',     items: ['AWS', 'GCP', 'Docker', 'GKE', 'Terraform'] },
  { label: 'AI',        items: ['LangGraph', 'LangChain', 'RAG', 'Vertex AI', 'OpenAI API', 'Milvus'] },
  { label: 'Frontend',  items: ['React', 'Next.js', 'Streamlit'] },
]

function Stack() {
  return (
    <>
      <Head kicker="technologies" title="Tech Stack" />
      <dl className="nb-stack">
        {STACK.map(row => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.items.map(t => <span key={t} data-core={CORE.has(t) || undefined}>{t}</span>)}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

function Life() {
  return (
    <>
      <Head kicker="beyond code" title="Life & Interests" />
      <p className="nb-lead">Characters and sci-fi scenes I draw between builds.</p>
      <div className="nb-life">
        <Picture card={{ album: 'art', tilt: -2, tape: 'pink', pile: true, caption: 'my drawings — click to leaf through' }} className="nb-pile-art" />
        <div className="nb-life-wall">
          <p className="nb-shelf-label"><Doodle kind="film" label="Films" /> films</p>
          <Shelf album="posters" />
        </div>
      </div>
      <div className="nb-life-games">
        <p className="nb-shelf-label"><Doodle kind="game" label="Games" /> games</p>
        <Shelf album="games" />
      </div>
    </>
  )
}

function Contact() {
  return (
    <>
      <Head kicker="get in touch" title="Let's Work Together"
            sub="Open to full-time roles, collaborations, and interesting conversations." />
      <dl className="nb-contact">
        <div><Logo kind="email" href={`mailto:${SITE.email}`} label="Email" /><dt>email</dt><dd><a href={`mailto:${SITE.email}`}>{SITE.email}</a></dd></div>
        <div><Logo kind="linkedin" href={SITE.linkedin} label="LinkedIn" /><dt>LinkedIn</dt><dd><Out href={SITE.linkedin}>{SITE.linkedinHandle}</Out></dd></div>
        <div><Logo kind="github" href={SITE.github} label="GitHub" /><dt>GitHub</dt><dd><Out href={SITE.github}>{SITE.githubHandle}</Out></dd></div>
        <div><Logo kind="phone" href={SITE.phoneHref} label="Phone" /><dt>phone</dt><dd><a href={SITE.phoneHref}>{SITE.phone}</a></dd></div>
        <div><Logo kind="resume" href={SITE.resume} label="Resume (PDF)" download /><dt>resume</dt><dd><Out href={SITE.resume} download>PDF</Out></dd></div>
      </dl>
    </>
  )
}

function MainPage({ main, spread }: { main: Main; spread: number }) {
  switch (main.kind) {
    case 'about':      return <About />
    case 'experience': return <Experience />
    case 'project':    return <Project main={main} spread={spread} />
    case 'principles': return <Principles main={main} />
    case 'stack':      return <Stack />
    case 'life':       return <Life />
    case 'contact':    return <Contact />
  }
}

/** Every page, notes included. A phone drops the note pages but the contents, and
 *  shows each note at the foot of its page instead. */
export function Pages() {
  return (
    <>
      <FrontCover />
      {SPREADS.map((s, i) => [
        <Page key={`${s.slug}-note`} kind="note" side="left">
          <Notes spread={i} />
        </Page>,
        <Page key={s.slug} kind="main" side="right" folio={folio(i)} slug={s.slug}>
          {i > 0 && <ToContents />}
          <div className="nb-main"><MainPage main={s.main} spread={i} /></div>
          {/* on a phone there's no facing page: the note is written at the foot of this one */}
          {i > 0 && <aside className="nb-foot-note" aria-label="Notes"><Notes spread={i} /></aside>}
        </Page>,
      ])}
      <BackCover />
    </>
  )
}
