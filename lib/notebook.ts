/** The notebook's table of contents and everything written beside each page.
 *
 *  Each spread is one content page and the note that goes with it. On a desktop
 *  the content pages are the book and the note sits in the narrow strip to their
 *  left; on a phone each note is its own page, just before the page it's about.
 *  Facts come from bentoData and the résumé; quotes carry their primary source. */

import type { DiagramSpec } from '@/components/notebook/Ink'
import { bentoDetails } from '@/lib/bentoData'
import { SITE } from '@/lib/siteConfig'

export type Tone = 'ink' | 'blue' | 'red' | 'pencil'

export interface Quote { text: string; who: string; source: string }

export interface Picture { src: string; alt: string; caption?: string }

/** Every picture that can be lifted off the page, in sets you can leaf through once it's lifted. */
export const ALBUMS: Record<string, Picture[]> = {
  robin: [
    ...bentoDetails.robin.shots!,
    { src: '/shots/robin-mobile.webp', alt: 'The Robin dashboard on a phone: today\'s deadlines, todos and events, then the rest of the week', caption: 'The same dashboard on a phone.' },
  ],
  nighty: bentoDetails.nighty.shots!,
  art: [
    { src: '/art/sci-fi.webp', alt: 'Two figures on a lunar surface, with Earth filling the sky', caption: 'Two figures on the Moon, Earth overhead.' },
    { src: '/art/gwen.webp', alt: 'Ghost-Spider in a white hood, painted over orange and teal brushstrokes', caption: 'Ghost-Spider, over orange and teal.' },
  ],
  // theatrical posters, via Wikipedia — the order they're stuck to the wall in, last on top
  posters: [
    { src: '/posters/batman-begins.webp', alt: 'Batman Begins (2005) theatrical poster', caption: 'Batman Begins · Christopher Nolan, 2005' },
    { src: '/posters/the-dark-knight.webp', alt: 'The Dark Knight (2008) theatrical poster', caption: 'The Dark Knight · Christopher Nolan, 2008' },
    { src: '/posters/the-dark-knight-rises.webp', alt: 'The Dark Knight Rises (2012) theatrical poster', caption: 'The Dark Knight Rises · Christopher Nolan, 2012' },
    { src: '/posters/interstellar.webp', alt: 'Interstellar (2014) theatrical poster', caption: 'Interstellar · Christopher Nolan, 2014' },
    { src: '/posters/inception.webp', alt: 'Inception (2010) theatrical poster', caption: 'Inception · Christopher Nolan, 2010' },
    { src: '/posters/blade-runner-2049.webp', alt: 'Blade Runner 2049 (2017) theatrical poster', caption: 'Blade Runner 2049 · Denis Villeneuve, 2017' },
    { src: '/posters/across-the-spider-verse.webp', alt: 'Spider-Man: Across the Spider-Verse (2023) theatrical poster', caption: 'Spider-Man: Across the Spider-Verse · Dos Santos, Powers & Thompson, 2023' },
  ],
  // box art, via Wikipedia
  games: [
    { src: '/games/elden-ring.webp', alt: 'Elden Ring box art', caption: 'Elden Ring · FromSoftware, 2022' },
    { src: '/games/balatro.webp', alt: 'Balatro cover art', caption: 'Balatro · LocalThunk, 2024' },
    { src: '/games/dark-souls-iii.webp', alt: 'Dark Souls III cover art', caption: 'Dark Souls III · FromSoftware, 2016' },
    { src: '/games/hades.webp', alt: 'Hades cover art', caption: 'Hades · Supergiant Games, 2020' },
    { src: '/games/black-myth-wukong.webp', alt: 'Black Myth: Wukong cover art', caption: 'Black Myth: Wukong · Game Science, 2024' },
    { src: '/games/hollow-knight.webp', alt: 'Hollow Knight cover art', caption: 'Hollow Knight · Team Cherry, 2017' },
    { src: '/games/stardew-valley.webp', alt: 'Stardew Valley cover art', caption: 'Stardew Valley · ConcernedApe, 2016' },
  ],
  books: [
    { src: '/books/project-hail-mary.webp', alt: 'Project Hail Mary, first edition cover', caption: 'Project Hail Mary · Andy Weir, 2021' },
    { src: '/books/designing-data-intensive-applications.webp', alt: 'Designing Data-Intensive Applications, O\'Reilly cover with a boar', caption: 'Designing Data-Intensive Applications · Martin Kleppmann, 2017' },
    { src: '/books/atomic-habits.webp', alt: 'Atomic Habits, first edition cover', caption: 'Atomic Habits · James Clear, 2018' },
  ],
  certs: [
    { src: '/certs/ai-fluency.webp', alt: 'Certificate of completion: AI Fluency: Framework & Foundations, Anthropic, awarded to Chi Cheng', caption: 'AI Fluency: Framework & Foundations · Anthropic' },
    { src: '/certs/claude-101.webp', alt: 'Certificate of completion: Claude 101, Anthropic, awarded to Chi Cheng', caption: 'Claude 101 · Anthropic' },
  ],
  me: [
    { src: '/photos/bruce.webp', alt: 'Bruce Cheng smiling, in a suit and a UC San Diego graduation stole', caption: 'Hi there! I\'m Bruce (also go by Chi).' },
  ],
  resume: [
    { src: '/resume/resume-2026-october.webp', alt: 'Chi (Bruce) Cheng — résumé, October 2026', caption: 'October 2026' },
  ],
}

/** A die-cut sticker stuck on a project page; clicking it opens the project. */
export interface Sticker { kind: 'robin' | 'moon' | 'parking'; label: string }

/** A picture from an album, tipped into the page like a card. */
export interface Card {
  album: string
  index?: number
  /** a shorter caption than the album's, to fit the page */
  caption?: string
  tilt?: number
  /** what holds it to the page: a strip of washi tape, or a paper clip */
  tape?: 'yellow' | 'blue' | 'pink' | 'clip'
  /** show the whole album as a pile, this picture on top */
  pile?: boolean
}

/** A personality result drawn as hand-ruled bars. */
export interface Traits {
  title: string
  source: string
  rows: { trait: string; pct: number; vs: string }[]
}

export interface Note {
  quote?: Quote
  /** in Bruce's own words — never written on Bruce's behalf */
  memo?: string
  /** short margin facts, in blue pen */
  facts?: string[]
  card?: Card
  /** a link written under the card */
  link?: { href: string; label: string; download?: boolean }
  traits?: Traits
  /** an album laid out as a row of small covers */
  shelf?: string
  /** whose project it was — a company's or a sponsor's logo, tipped in */
  logo?: { src: string; alt: string }
  /** one number from the work, written big and ringed — from the résumé */
  stat?: { big: string; small: string }
  /** a hackathon placing, as a prize rosette */
  award?: { place: string; text: string }
  /** a paper plane, looping off the page */
  plane?: boolean
}

export type Main =
  | { kind: 'about' }
  | { kind: 'experience' }
  | {
      kind: 'project'; key: string; heading?: string; diagram: DiagramSpec
      /** bentoData points by index, or a bullet given in full — from the résumé or the project's README */
      points: (number | string)[]
      /** a sentence under the heading saying what the thing is */
      lead?: string
      /** a sticker on the page that opens the project — its demo, else its source */
      sticker?: Sticker
      /** in place of bentoData's metrics, when those have gone stale */
      metrics?: string[]
      /** leave off the tag line, for a page that needs the room */
      tags?: false
    }
  | {
      /** a page of short rules, each with a highlighted lead-in */
      kind: 'principles'; kicker: string; title: string
      items: { lead: string; text: string }[]
    }
  | { kind: 'stack' }
  | { kind: 'life' }
  | { kind: 'contact' }

export interface Spread {
  /** the URL hash that opens the book on this spread */
  slug: string
  /** its line in the table of contents */
  label: string
  /** projects are grouped under "What I've Built" in the contents */
  group?: 'work'
  note: Note | 'contents'
  main: Main
}

const QUOTES = {
  hamming: {
    text: 'If you do not work on an important problem, it\'s unlikely you\'ll do important work.',
    who: 'Richard Hamming', source: '"You and Your Research", 1986',
  },
  lovelace: {
    text: 'The Analytical Engine has no pretensions whatever to originate any thing. It can do whatever we know how to order it to perform.',
    who: 'Ada Lovelace', source: 'Note G, 1843',
  },
  shannon: {
    text: 'The fundamental problem of communication is that of reproducing at one point either exactly or approximately a message selected at another point.',
    who: 'Claude Shannon', source: '"A Mathematical Theory of Communication", 1948',
  },
  feynman: {
    text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    who: 'Richard Feynman', source: '"Cargo Cult Science", 1974',
  },
  brooks: {
    text: 'Plan to throw one away; you will, anyhow.',
    who: 'Fred Brooks', source: 'The Mythical Man-Month, 1975',
  },
  einstein: {
    text: 'It can scarcely be denied that the supreme goal of all theory is to make the irreducible basic elements as simple and as few as possible without having to surrender the adequate representation of a single datum of experience.',
    who: 'Albert Einstein', source: '"On the Method of Theoretical Physics", 1933',
  },
  dijkstra: {
    text: 'Simplicity is prerequisite for reliability.',
    who: 'Edsger W. Dijkstra', source: '"How do we tell truths that might hurt?" (EWD498), 1975',
  },
  torvalds: {
    text: 'Talk is cheap. Show me the code.',
    who: 'Linus Torvalds', source: 'linux-kernel mailing list, Aug 2000',
  },
  turing: {
    text: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.',
    who: 'Alan Turing', source: '"Computing Machinery and Intelligence", 1950',
  },
} satisfies Record<string, Quote>

export const SPREADS: Spread[] = [
  {
    slug: 'about', label: 'About',
    note: 'contents',
    main: { kind: 'about' },
  },
  {
    slug: 'experience', label: 'Where I\'ve Worked',
    note: {
      quote: QUOTES.hamming,
      card: { album: 'resume', caption: 'The full résumé, October 2026 — click to read it.', tilt: -0.8, tape: 'clip' },
      link: { href: SITE.resume, label: 'download the PDF', download: true },
    },
    main: { kind: 'experience' },
  },
  {
    slug: 'helport', label: 'Helport AI', group: 'work',
    note: {
      quote: QUOTES.shannon,
      logo: { src: '/logos/helport.webp', alt: 'Helport AI' },
      stat: { big: '6×', small: 'lower inference cost — $0.002 → $0.00031 a match' },
      facts: ['promoted to full-time, Mar 2025', '50k+ call records a week, into dashboards', 'release cycle 14d → 5d'],
    },
    main: {
      kind: 'project', key: 'helport', heading: 'Helport AI',
      points: [
        // October 2026 CV — it no longer claims the 20ms latency bentoData's first point does
        'Built Python/FastAPI services for an AI call assistant across mortgage, healthcare, insurance, and government workflows; shipped Docker/CI/CD deployments and real-time guidance APIs.',
        1, 2,
      ],
      diagram: {
        w: 460, h: 214,
        nodes: [
          { id: 'caller', x: 6,   y: 18,  w: 92,  h: 44, label: 'caller' },
          { id: 'assist', x: 150, y: 12,  w: 150, h: 56, label: 'call assistant\nPython · Docker' },
          { id: 'old',    x: 6,   y: 128, w: 136, h: 52, label: 'Dialogflow\n$0.002 / match', tone: 'pencil', strike: true },
          { id: 'new',    x: 296, y: 128, w: 158, h: 52, label: 'Gemini 2.0\n+ Vertex AI', hl: true },
        ],
        edges: [
          { from: 'caller', to: 'assist' },
          { from: 'assist', to: 'new', label: 'intent match' },
          { from: 'old', to: 'new', label: '6× cheaper', tone: 'red' },
        ],
        notes: [{ x: 375, y: 204, text: '$0.00031 / match', tone: 'red', anchor: 'middle' }],
      },
    },
  },
  {
    slug: 'robin', label: 'Robin', group: 'work',
    note: {
      memo: 'I wanted an agent that cuts the time I spend finding and filing things, so more of my day goes to what I want to do, or should be doing.',
      card: { album: 'robin', caption: 'One assistant box at the top, then agenda, todos, the job hunt and saved links.', tilt: 1.4, tape: 'blue', pile: true },
    },
    main: {
      // from Bruce's own description of Robin, Oct 2026
      kind: 'project', key: 'robin', heading: 'Robin',
      lead: 'A personal AI workbench with a lasting working context — one that helps you act, not just answer.',
      sticker: { kind: 'robin', label: 'on GitHub' },
      metrics: ['one shared work state', 'four workspaces', 'acts within set permissions'],
      tags: false,
      points: [
        'The problem isn\'t a missing chat box: information is scattered, AI conversations are cut off from the work, and picking anything back up means explaining it all again.',
        'Robin knows what you\'re working on — a chapter, a practice problem, a research topic, an opening — and helps move it forward: it explains, searches and filters, and through limited tools records tasks, schedules and updates records.',
        'It keeps the working state: whether a todo is done, when an interview starts, when a problem is due for review, what a research thread has collected — none of it only in a chat log.',
      ],
      diagram: {
        w: 500, h: 236,
        nodes: [
          { id: 'you',    x: 6,   y: 70,  w: 96,  h: 48, label: 'you\nweb · Telegram' },
          { id: 'state',  x: 126, y: 62,  w: 112, h: 64, label: 'shared\nwork state', hl: true },
          { id: 'engine', x: 126, y: 170, w: 112, h: 50, label: 'pi agent\non Pi Web' },
          { id: 'daily',  x: 270, y: 4,   w: 224, h: 48, label: 'daily life\nmail · todos · calendar' },
          { id: 'learn',  x: 270, y: 62,  w: 224, h: 48, label: 'learning\ncourses · practice · review' },
          { id: 'jobs',   x: 270, y: 120, w: 224, h: 48, label: 'job hunt\nroles · OA · interviews' },
          { id: 'desk',   x: 270, y: 178, w: 224, h: 48, label: 'research\nsources · notes · evidence' },
        ],
        edges: [
          { from: 'you', to: 'state', both: true },
          { from: 'state', to: 'daily', both: true },
          { from: 'state', to: 'learn', both: true },
          { from: 'state', to: 'jobs', both: true },
          { from: 'state', to: 'desk', both: true },
          { from: 'engine', to: 'state', label: 'limited tools', tone: 'red', dashed: true },
        ],
      },
    },
  },
  {
    slug: 'robin-design', label: 'Robin: what it isn\'t', group: 'work',
    note: {
      quote: QUOTES.lovelace,
      card: { album: 'robin', index: 2, caption: 'NeetCode\'s own problem page in the middle; the coach on the right hints instead of answering.', tilt: -1.2, tape: 'yellow' },
    },
    main: {
      kind: 'principles', kicker: 'project · Robin, continued', title: 'What it isn\'t',
      items: [
        { lead: 'Not just a dashboard.', text: 'It doesn\'t stop at showing information — it helps handle it.' },
        { lead: 'Not just a chat assistant.', text: 'The work state is kept apart from the conversation, so starting a new chat doesn\'t wipe the work.' },
        { lead: 'Not a fully autonomous agent.', text: 'The AI\'s permissions are limited to each workspace; important decisions, and anything that needs confirming, stay with the person.' },
        { lead: 'Not a replacement for every other tool.', text: 'It connects mail, courses, job sources and knowledge bases rather than rebuilding them.' },
        { lead: 'Built on Pi Web.', text: 'Pi Web provides the agent sessions and the tool runtime; Robin organises the actual work on top of them.' },
      ],
    },
  },
  {
    slug: 'parking', label: 'Parking Spot Locator', group: 'work',
    note: {
      quote: QUOTES.dijkstra,
      logo: { src: '/logos/bosch.webp', alt: 'Bosch' },
      stat: { big: '3×', small: 'faster than traditional visual search — 45s → 15s' },
      facts: ['sponsored by Bosch', 'a plain-English query comes back as a highlighted map overlay'],
    },
    main: {
      kind: 'project', key: 'parking', points: [0, 1, 2],
      sticker: { kind: 'parking', label: 'live' },
      diagram: {
        w: 460, h: 206,
        nodes: [
          { id: 'q',      x: 6,   y: 10,  w: 168, h: 52, label: '"near the elevator\non level 2"', tone: 'blue' },
          { id: 'api',    x: 214, y: 10,  w: 140, h: 52, label: 'FastAPI on EC2\nasync queue' },
          { id: 'sensor', x: 6,   y: 128, w: 120, h: 46, label: 'sensor data' },
          { id: 'clip',   x: 170, y: 116, w: 150, h: 70, label: 'CLIP embeddings\n+ VLM spatial\nreasoning', hl: true },
          { id: 'map',    x: 356, y: 116, w: 98,  h: 70, label: 'highlighted\nmap overlay', tone: 'blue' },
        ],
        edges: [
          { from: 'q', to: 'api' },
          { from: 'api', to: 'clip' },
          { from: 'sensor', to: 'clip' },
          { from: 'clip', to: 'map' },
        ],
        notes: [{ x: 405, y: 196, text: '3× faster', tone: 'red', anchor: 'middle' }],
      },
    },
  },
  {
    slug: 'nightynight', label: 'NightyNight', group: 'work',
    note: {
      card: { album: 'nighty', tilt: -1.6, tape: 'yellow' },
      facts: ['4 audiences: toddler · child · teen · adult', '7 narrator voices'],
    },
    main: {
      kind: 'project', key: 'nighty', points: [0, 1, 3],
      sticker: { kind: 'moon', label: 'try it' },
      diagram: {
        w: 460, h: 220,
        nodes: [
          { id: 'client', x: 6,   y: 14,  w: 118, h: 50, label: 'React / TS\nclient' },
          { id: 'api',    x: 196, y: 14,  w: 110, h: 50, label: 'FastAPI', hl: true },
          { id: 'graph',  x: 150, y: 100, w: 304, h: 110, label: 'LangGraph', frame: true },
          { id: 'idea',   x: 162, y: 140, w: 84,  h: 44, label: 'ideation' },
          { id: 'story',  x: 256, y: 140, w: 88,  h: 44, label: 'narrative' },
          { id: 'age',    x: 354, y: 134, w: 92,  h: 56, label: 'age-adaptive\nrewrite' },
          { id: 'tts',    x: 6,   y: 140, w: 118, h: 50, label: 'ElevenLabs\nTTS' },
        ],
        edges: [
          { from: 'api', to: 'client', label: 'SSE', tone: 'red' },
          { from: 'api', to: 'graph' },
          { from: 'api', to: 'tts' },
        ],
      },
    },
  },
  {
    slug: 'research', label: 'Research Assistant Agent', group: 'work',
    note: {
      quote: QUOTES.feynman,
      stat: { big: '30+', small: 'academic papers indexed in Milvus' },
      facts: ['cross-language retrieval + translation'],
    },
    main: {
      kind: 'project', key: 'research', points: [0, 1, 2],
      diagram: {
        w: 460, h: 206,
        nodes: [
          { id: 'gke',    x: 150, y: 4,   w: 304, h: 196, label: 'GKE + autoscaler', frame: true },
          { id: 'ui',     x: 6,   y: 20,  w: 112, h: 46, label: 'Streamlit UI' },
          { id: 'agent',  x: 170, y: 14,  w: 190, h: 58, label: 'LangGraph agent\nreview · gaps · summary', hl: true },
          { id: 'milvus', x: 290, y: 114, w: 150, h: 54, label: 'Milvus\n30+ papers' },
        ],
        edges: [
          { from: 'ui', to: 'agent' },
          { from: 'agent', to: 'milvus', label: 'RAG', tone: 'red' },
        ],
      },
    },
  },
  {
    slug: 'capitawise', label: 'Capitawise', group: 'work',
    note: {
      quote: QUOTES.brooks,
      logo: { src: '/logos/franklin-templeton.webp', alt: 'Franklin Templeton' },
      award: { place: '2nd', text: 'of 20+ teams at the Franklin Templeton Hack-a-Thon · $7,000' },
      facts: ['first-contact resolution 68% → 85%'],
    },
    main: {
      kind: 'project', key: 'capitawise', points: [0, 1, 2],
      diagram: {
        w: 460, h: 120,
        nodes: [
          { id: 'client', x: 6,   y: 34, w: 110, h: 50, label: 'React client' },
          { id: 'svc',    x: 160, y: 30, w: 130, h: 58, label: 'Node.js\n+ Flask' },
          { id: 'gpt',    x: 330, y: 30, w: 124, h: 58, label: 'GPT-4o\ndialogue layer', hl: true },
        ],
        edges: [{ from: 'client', to: 'svc' }, { from: 'svc', to: 'gpt' }],
      },
    },
  },
  {
    slug: 'pawprints', label: 'PawPrints', group: 'work',
    note: {
      quote: QUOTES.torvalds,
      logo: { src: '/logos/franklin-templeton.webp', alt: 'Franklin Templeton' },
      award: { place: '1st', text: 'of 30+ teams at the Franklin Templeton Hack-a-Thon · $15,000' },
      facts: ['team of 4 — product owner and primary full-stack developer'],
    },
    main: {
      kind: 'project', key: 'pawprints', points: [0, 1, 2],
      diagram: {
        w: 460, h: 186,
        nodes: [
          { id: 'web',   x: 6,   y: 14,  w: 104, h: 46, label: 'React.js' },
          { id: 'api',   x: 160, y: 14,  w: 132, h: 46, label: 'Express.js API' },
          { id: 'db',    x: 342, y: 14,  w: 112, h: 46, label: 'MySQL' },
          { id: 'chain', x: 130, y: 118, w: 200, h: 56, label: 'on-chain pet identity\n+ adoption history', tone: 'blue', hl: true },
        ],
        edges: [{ from: 'web', to: 'api' }, { from: 'api', to: 'db' }, { from: 'api', to: 'chain', dashed: true }],
      },
    },
  },
  {
    slug: 'stack', label: 'Tech Stack',
    note: {
      quote: QUOTES.einstein,
      facts: ['only tools that show up in the work'],
      card: { album: 'certs', caption: 'Two certificates from Anthropic — click to leaf through.', tilt: -1.4, tape: 'yellow', pile: true },
    },
    main: { kind: 'stack' },
  },
  {
    slug: 'life', label: 'Life & Interests',
    note: {
      shelf: 'books',
      // the 16Personalities result (test taken Jan 24, 2023), as Bruce corrected it in Oct 2026: ENFJ, Judging 51%
      traits: {
        title: 'ENFJ-A', source: '16Personalities, Jan 2023',
        rows: [
          { trait: 'Extraverted', pct: 57, vs: 'Introverted' },
          { trait: 'Intuitive',   pct: 68, vs: 'Observant' },
          { trait: 'Feeling',     pct: 61, vs: 'Thinking' },
          { trait: 'Judging',     pct: 51, vs: 'Prospecting' },
          { trait: 'Assertive',   pct: 72, vs: 'Turbulent' },
        ],
      },
    },
    main: { kind: 'life' },
  },
  {
    slug: 'contact', label: 'Let\'s Work Together',
    note: { quote: QUOTES.turing, facts: ['full-time software roles, from Dec 2026', 'at CMU Silicon Valley until then'], plane: true },
    main: { kind: 'contact' },
  },
]

/** Which spread a slug names — what `data-goto` links carry. */
export const spreadOf = (slug: string) => SPREADS.findIndex(s => s.slug === slug)
