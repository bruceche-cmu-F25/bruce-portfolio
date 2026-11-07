/** Everything the homepage says, in one place.
 *
 *  Every claim here is lifted from the November 2026 résumé, or — for the work
 *  that résumé leaves out for space (the UCSD teaching job, the research agent,
 *  the two hackathons) — from the October 2026 one and bentoData. Nothing on
 *  this page is written on Bruce's behalf. Change a number here only after it
 *  changes in the PDF.
 */
import { SITE } from '@/lib/siteConfig'
import type { Shot } from '@/components/home/Shots'

/** Where Bruce is, for the clock in the corner of the scene. */
export const PLACE = { label: 'San Francisco', tz: 'America/Los_Angeles' } as const

export const INTRO = {
  name: 'Bruce Cheng',
  role: 'Software Engineer · AI Agents',
  /** Two short paragraphs. Links are marked with [text](href) and rendered as real anchors. */
  paragraphs: [
    `Hi, I'm Bruce — a software engineer finishing an MS in Software Engineering at [Carnegie Mellon](https://www.cmu.edu/silicon-valley/), Silicon Valley, in December 2026. I build agentic systems, and the backends that keep them fast. I'm a graduate researcher in CMU's AGAI group, on detecting and explaining LLM hallucinations.`,
    `Before CMU I shipped production AI at [Helport AI](#experience): a call assistant where I cut inference cost 6× and average handling time 35%. On my own time I'm building [Robin](#robin), a personal AI workspace that keeps its working context instead of forgetting it with every new chat. I'm open to new-grad SWE, FDE and AI roles from December 2026. [Say hi](mailto:${SITE.email}).`,
  ],
} as const

/** The roles, newest first — same four the notebook lists, same wording.
 *
 *  `mark` names a file in public/logos/dither, written by scripts/make-art.py:
 *  the organisation's logo redrawn as a 1-bit dither and used as a CSS mask, so
 *  it takes the page's ink colour instead of bringing its own brand palette to
 *  a dark page. `wide` is for the wordmarks, which need a longer box. */
export const ROLES = [
  {
    org: 'CMU AGAI Group', role: 'Graduate Researcher', date: 'Aug 2026 — Present', mark: 'agai',
    detail: 'A fact-level hallucination-detection pipeline: atomic fact extraction and NLI verification on TriviaQA and SQuAD. Precision up 6 percentage points, accuracy 82% → 90%.',
  },
  {
    org: 'Helport AI · Nasdaq-listed', role: 'AI Product Developer / PM', date: 'Sep 2024 — Jun 2025', mark: 'helport', wide: true,
    detail: 'Moved intent matching off Dialogflow onto Gemini 2.0 and Vertex AI, 6× cheaper per match, and built a FastAPI dialogue-flow system: accuracy 62% → 89%, handling time 35% shorter, dev cycle 14d → 5d.',
  },
  {
    org: 'Convoloo', role: 'Software Development Engineer Intern', date: 'Jul 2024 — Sep 2024', mark: 'convoloo',
    detail: 'An AI medical chatbot on FastAPI, LangChain and Google Cloud that identifies 50+ common diseases. RAG retrieval cut peak-load response time 2.5s → 1.5s.',
  },
  {
    org: 'UC San Diego · MATH 20D', role: 'Instructional Assistant', date: 'Sep 2023 — Apr 2024', mark: 'ucsd',
    detail: 'Office hours, review sessions and grading for 100+ students in differential equations.',
  },
] as const

export const SCHOOLS = [
  { school: 'Carnegie Mellon University · Silicon Valley', degree: 'MS Software Engineering', date: 'Dec 2026', mark: 'cmu' },
  { school: 'UC San Diego', degree: 'BS Mathematics–Computer Science', date: 'Apr 2025', mark: 'ucsd' },
] as const

export type Status = 'live' | 'dev' | 'archive'

/** `art` names the isometric drawing in components/home/Iso.tsx.
 *
 *  A card has to answer four things before anyone clicks it: what kind of thing
 *  this was, when, what it does, and how big it got. `kind` and `when` carry
 *  the first two and `facts` the last — two figures at most, from the same
 *  résumé-backed numbers bentoData holds, so the size of a project is readable
 *  without opening it. */
export interface Project {
  key: string
  art: 'robin' | 'moon' | 'deck' | 'papers' | 'teller' | 'chain'
  title: string
  kind: string
  when: string
  blurb: string
  /** at most two, short enough to sit on one line together */
  facts: string[]
  status: Status
  href?: string
  /** what the link is, for the glyph and the label at the foot of the card */
  linkKind?: 'site' | 'repo'
  tags: string[]
  /** Where the like counter starts. What a visitor sees is this plus every
   *  real like stored for the project (components/home/Like.tsx), so the
   *  button never opens on an empty zero. Bruce's call, Nov 2026. */
  likes: number
  /** Screenshots the card's picture can step to, after its drawing. The
   *  captions are bentoData's; Parking's was shot from the live site, Nov 2026. */
  shots?: Shot[]
}

export const PROJECTS: Project[] = [
  {
    key: 'robin', art: 'robin', title: 'Robin', status: 'dev',
    kind: 'Project · open source', when: 'Jul 2026 — present',
    blurb: 'A personal AI workspace wired into Gmail, Google Calendar and Telegram, turning plain-language requests and incoming email into tracked tasks and interview schedules.',
    facts: ['Gmail · Calendar · Telegram', 'scoped tool allowlists'],
    href: 'https://github.com/bruceche-cmu-F25/pi-web-robin', linkKind: 'repo',
    tags: ['TypeScript', 'Next.js', 'SQLite', 'Pi Agent SDK'],
    likes: 31,
    shots: [
      { src: '/shots/robin-dashboard.webp', label: 'Dashboard', alt: 'The Robin dashboard: assistant box, agenda, todos and the job hunt on one page' },
      { src: '/shots/robin-week.webp', label: 'Week view', alt: 'The week grid, with an all-day band and a deadlines row above the time grid' },
      { src: '/shots/robin-coding.webp', label: 'Coding workspace', alt: 'The coding workspace: the NeetCode rail, the problem itself, and a coach panel' },
      { src: '/shots/robin-mobile.webp', label: 'On a phone', fit: 'contain', alt: 'The Robin dashboard on a phone: today\'s deadlines, todos and events, then the rest of the week' },
    ],
  },
  {
    key: 'nighty', art: 'moon', title: 'NightyNight', status: 'live',
    kind: 'Project · independent', when: 'Apr 2025 — Jul 2026',
    blurb: 'Bedtime stories written and narrated on demand. A LangGraph multi-agent pipeline writes the chapters in parallel, pitched to the listener\'s age, and streams them over SSE.',
    facts: ['7 narrator voices', 'chapters written in parallel'],
    href: 'https://nightynight-1.onrender.com/', linkKind: 'site',
    tags: ['LangGraph', 'FastAPI', 'React', 'ElevenLabs'],
    likes: 24,
    shots: [
      { src: '/shots/nightynight.webp', label: 'Landing page', alt: 'The NightyNight landing page: a planet limb under a starfield' },
    ],
  },
  {
    key: 'parking', art: 'deck', title: 'Parking Spot Locator', status: 'live',
    kind: 'Project · CMU × Bosch', when: 'Aug — Dec 2025',
    blurb: 'Ask for a spot in plain English and get it highlighted on the map, with CLIP embeddings doing the spatial reasoning.',
    facts: ['3× faster queries', '45s → 15s'],
    href: 'https://psl.fogx.link', linkKind: 'site',
    tags: ['VLMap', 'CLIP', 'FastAPI', 'AWS'],
    likes: 19,
    shots: [
      { src: '/shots/parking.webp', label: 'The live app', alt: 'The Parking Spot Locator: a map picker, similarity threshold and text query on the left, the parking-lot map on the right' },
    ],
  },
  {
    key: 'research', art: 'papers', title: 'Research Assistant Agent', status: 'archive',
    kind: 'Project · CMU 14-825', when: 'Jan — Mar 2026',
    blurb: 'Multi-step literature review, gap analysis and summaries over a corpus it has indexed for semantic retrieval.',
    facts: ['30+ papers indexed', 'autoscaled on GKE'],
    tags: ['LangGraph', 'RAG', 'Milvus', 'GKE'],
    likes: 12,
  },
  {
    key: 'capitawise', art: 'teller', title: 'Capitawise', status: 'archive',
    kind: 'Hackathon · Franklin Templeton', when: 'Mar — Jun 2024',
    blurb: 'An AI banking assistant: a GPT-4o dialogue layer over Node.js and Flask services behind a React client.',
    facts: ['2nd of 20+ teams', '$7,000'],
    tags: ['GPT-4o', 'React', 'Node.js', 'Flask'],
    likes: 15,
  },
  {
    key: 'pawprints', art: 'chain', title: 'PawPrints', status: 'archive',
    kind: 'Hackathon · Franklin Templeton', when: 'Mar — Jun 2023',
    blurb: 'Web3 pet adoption, with each animal\'s identity and adoption history kept on-chain. Led a team of 4.',
    facts: ['1st of 30+ teams', '$15,000'],
    tags: ['Web3', 'React.js', 'Express.js', 'MySQL'],
    likes: 17,
  },
]

/** The SKILLS section of the November 2026 résumé, in its own two groups and
 *  order (its "Steamlit" and doubled "milvus" tidied), then the tools the
 *  October one listed that this one leaves out for space. */
export const STACK: { label: string; items: string[] }[] = [
  {
    label: 'Development & Cloud',
    items: ['Python', 'Java', 'C/C++', 'JavaScript', 'TypeScript', 'Go', 'FastAPI', 'Flask',
            'Node.js', 'Express.js', 'MySQL', 'MongoDB', 'SQLite', 'RESTful APIs', 'OAuth', 'AWS',
            'GCP', 'Docker', 'Kubernetes', 'Terraform', 'GKE', 'CI/CD', 'React', 'Next.js',
            'Streamlit', 'Figma', 'Git', 'Agile / Scrum'],
  },
  {
    label: 'AI / ML & Frameworks',
    items: ['LangGraph', 'LangChain', 'RAG', 'LLM APIs', 'OpenAI API', 'Vertex AI', 'PyTorch',
            'TensorFlow', 'Hugging Face', 'vLLM', 'Milvus', 'Tool calling', 'Agentic workflows',
            // not in the skills list, but what the AGAI work above is built on
            'NLI', 'LLM evaluation'],
  },
  {
    label: 'Earlier',
    items: ['F#', 'scikit-learn', 'Pandas', 'HTML/CSS', 'NestJS'],
  },
]

/** The tools the work leans on most, written a shade brighter. */
export const CORE = new Set(['Python', 'TypeScript', 'FastAPI', 'LangGraph', 'React', 'Docker'])

export const SEEKING = {
  roles: ['Forward Deployed Engineer', 'AI / agent engineering', 'Full-stack', 'New-grad SWE'],
  where: ['San Francisco', 'Bay Area onsite or remote', 'No visa sponsorship required'],
  from: 'Dec 2026',
} as const

/** The shelves on the Life row — albums already defined for the notebook. */
export const SHELVES = [
  { label: 'films', album: 'posters' },
  { label: 'games', album: 'games' },
  { label: 'books', album: 'books' },
] as const
