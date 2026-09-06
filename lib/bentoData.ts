export interface Metric { label: string; color: 'green' | 'blue' | 'amber' }

export interface BentoEntry {
  type: string; badge: string; org: string
  logo: string | null; live: boolean
  title: string; date: string
  award: string | null; demo: string | null
  /** source to read, for projects with nothing hosted to visit */
  repo?: string
  /** screenshots; the card shows the first, the detail panel shows them all.
   *  A caption is what makes a shot informative rather than decorative. */
  shots?: { src: string; alt: string; caption: string }[]
  metrics: Metric[]; points: string[]; tags: string[]
}

/** Franklin Templeton ships a "positive" mark — dark ink on transparency — while
 *  every other logo has a light background baked into the file. Only that one
 *  needs a tile painted behind it to read on the dark cards. */
export const logoNeedsTile = (src: string | null | undefined) => !!src?.includes('ft_logo')

export const bentoDetails: Record<string, BentoEntry> = {
  robin: {
    type: 'Project', badge: 'badge-project', org: 'Open source · fork of agegr/pi-web',
    logo: null, live: true,
    title: 'Robin — Personal Agent Workspace',
    date: 'Aug 2026 – Present', award: null, demo: null,
    repo: 'https://github.com/bruceche-cmu-F25/pi-web-robin',
    shots: [
      {
        src: '/shots/robin-dashboard.webp',
        alt: 'The Robin dashboard: assistant box, agenda, todos and the job hunt on one page',
        caption: 'One assistant box at the top, then agenda, todos, the job hunt and saved links. The line under each reply is built from the tool calls that actually ran, not from the model\'s prose.',
      },
      {
        src: '/shots/robin-week.webp',
        alt: 'The week grid, with an all-day band and a deadlines row above the time grid',
        caption: 'The week grid keeps an all-day band and a deadlines row above the time grid, gives overlapping events a share of the day\'s width, and is sized to its own content so it never traps the page\'s scroll.',
      },
      {
        src: '/shots/robin-coding.webp',
        alt: 'The coding workspace: the NeetCode rail, the problem itself, and a coach panel',
        caption: 'NeetCode\'s own problem page sits in the middle, judge included. A cross-origin frame reports nothing back, so clicking the rail is what tells the server which problem is open — the only reason the coach can answer about "this one".',
      },
    ],
    metrics: [
      { label: '80 commits over upstream', color: 'blue' },
      { label: 'Allow-list, no shell', color: 'blue' },
      { label: 'Telegram bridge', color: 'blue' },
    ],
    points: [
      'Forked agegr/pi-web — the browser UI for the pi coding agent — and built Robin beside it: a personal workspace driven by the same agent, 80 commits and ~300 files ahead of upstream and still syncing with it.',
      'The agent\'s reach is bounded at tool registration rather than by prompt: Robin sessions activate only their own allow-list, so pi\'s bash, read, write and edit stay inactive.',
      'Read-only Gmail triage that sorts the morning\'s mail into buckets, then opens a calendar event for an appointment and a todo for a deadline.',
      'Job hunt that scans configured boards and an ATS directory, scores each posting against a CV and rubric, and pushes twice-daily digests to Telegram with triage buttons.',
      'Coding workspace embedding the NeetCode roadmap next to a coach that climbs a hint ladder — what did you try, the pattern, the invariant, the algorithm — and records how far up it had to go.',
      'Mail is treated as untrusted input: the tool prompts extract facts from a message and never follow instructions found inside one.',
      'Google stays read-only and is fetched per request rather than copied into the local store, so disconnecting an account removes the data immediately.',
    ],
    tags: ['TypeScript', 'Next.js', 'React', 'pi-agent', 'Google APIs', 'Telegram', 'Bun'],
  },
  agai: {
    type: 'Research', badge: 'badge-work', org: 'CMU Applied Generative AI (AGAI)',
    logo: '/images/CMULogo.jpg', live: true,
    title: 'Graduate Researcher — Generative AI Reliability',
    date: 'Sep 2026 – Present', award: null, demo: null,
    metrics: [
      { label: 'Hallucination detection', color: 'blue' },
      { label: 'Interpretability', color: 'blue' },
    ],
    points: [
      'Conducting research under Dr. Mohamed Farag on LLM hallucination detection, mitigation, and interpretability.',
      'Focused on improving the reliability of Generative AI systems — measuring when a model is wrong, and why.',
      'Carnegie Mellon University, Pittsburgh, Pennsylvania · Remote.',
    ],
    tags: ['LLM Evaluation', 'Hallucination Detection', 'Interpretability', 'Generative AI'],
  },
  helport: {
    type: 'Work', badge: 'badge-work', org: 'Helport AI',
    logo: '/images/HelportLogo.jpg', live: false,
    title: 'AI Product Developer / PM',
    date: 'Sep 2024 – Jun 2025', award: null, demo: null,
    metrics: [
      { label: '35% AHT ↓', color: 'green' },
      { label: '6× cost reduction', color: 'green' },
      { label: '14d → 5d release cycle', color: 'green' },
      { label: '15% conversion ↑', color: 'green' },
    ],
    points: [
      'Built backend systems for an AI-driven call assistant across mortgage, healthcare, insurance and government sectors with Python, Docker and CI/CD, bringing response latency down to 20ms.',
      'Redesigned the intent-matching pipeline from Dialogflow to a Transformer-based system on Gemini 2.0 + Vertex AI, cutting inference cost 6× ($0.002 → $0.00031 per match).',
      'Reduced average handling time 35% through systematic A/B testing of conversational flows and escalation triggers.',
      'Compressed product release cycle from 14 days to 5 days via CI/CD automation and cross-functional stakeholder alignment.',
      'Built weekly data pipelines with Pandas + NumPy processing 50k+ call records for performance analytics dashboards.',
      'Promoted to full-time Product Developer in March 2025; drove a 15% conversion rate lift across enterprise accounts.',
    ],
    tags: ['FastAPI', 'Gemini 2.0', 'Vertex AI', 'A/B Testing', 'Pandas', 'NumPy', 'Docker', 'CI/CD', 'Python'],
  },
  nighty: {
    type: 'Project', badge: 'badge-project', org: 'Independent',
    logo: null, live: true,
    title: 'NightyNight',
    date: 'Apr 2025 – Present', award: null,
    demo: 'https://nightynight-1.onrender.com/',
    shots: [
      {
        src: '/shots/nightynight.webp',
        alt: 'The NightyNight landing page: a planet limb under a starfield',
        caption: 'The landing page. The generator itself sits behind sign-in.',
      },
    ],
    metrics: [
      { label: 'LangGraph multi-agent', color: 'blue' },
      { label: 'ElevenLabs TTS', color: 'blue' },
      { label: '4 audience profiles', color: 'blue' },
      { label: '7 narrator voices', color: 'blue' },
    ],
    points: [
      'Full-stack AI bedtime science story generator with React/TypeScript frontend and FastAPI backend.',
      'LangGraph multi-agent pipeline handles story ideation, narrative generation, and age-adaptive rewriting in parallel.',
      'Integrated ElevenLabs TTS with 7 narrator voices for immersive, character-driven audio playback.',
      'SSE streaming architecture delivers real-time story chunks to the client without polling.',
      'Supports 4 audience profiles (toddler, child, teen, adult) with dynamically adjusted vocabulary, sentence length, and tone.',
    ],
    tags: ['LangGraph', 'FastAPI', 'React', 'TypeScript', 'ElevenLabs', 'SSE', 'Python'],
  },
  ucsdia: {
    type: 'Work', badge: 'badge-work', org: 'UC San Diego · Mathematics',
    logo: null, live: false,
    title: 'Instructional Assistant',
    date: 'Sep 2023 – Apr 2024', award: null, demo: null,
    metrics: [{ label: '100+ students', color: 'green' }],
    points: [
      'Instructional assistant for MATH 20D, differential equations, in the UC San Diego mathematics department — 100+ students across the term.',
      'Held office hours and ran review sessions, working through problems with students rather than handing over the solution.',
      'Graded coursework and exams for the course.',
    ],
    tags: ['MATH 20D', 'Differential Equations', 'Office Hours', 'Review Sessions', 'Grading'],
  },
  convoloo: {
    type: 'Work', badge: 'badge-work', org: 'Convoloo',
    logo: '/images/convoloo_logo.jpeg', live: false,
    title: 'Software Development Engineer Intern',
    date: 'Jul 2024 – Sep 2024', award: null, demo: null,
    metrics: [
      { label: '2.5s → 1.5s response', color: 'green' },
      { label: '50+ diseases identified', color: 'green' },
    ],
    points: [
      'Developed an AI medical chatbot with FastAPI, LangChain, React and Google Cloud, identifying 50+ common diseases.',
      'Implemented RAG-based knowledge retrieval on Terraform-provisioned infrastructure with MySQL, cutting average response time from 2.5s to 1.5s.',
      'Led backend integration with LangServe and LangGraph across FastAPI and NestJS, streamlining service deployment.',
    ],
    tags: ['LangChain', 'LangServe', 'LangGraph', 'FastAPI', 'NestJS', 'React', 'GCP', 'Terraform', 'MySQL'],
  },
  research: {
    type: 'Project', badge: 'badge-project', org: 'CMU 14-825',
    logo: '/images/CMULogo.jpg', live: false,
    title: 'Research Assistant Agent',
    date: 'Jan 2026 – Mar 2026', award: null, demo: null,
    metrics: [
      { label: '30+ papers indexed', color: 'blue' },
      { label: 'GKE auto-scale', color: 'blue' },
      { label: 'Multilingual', color: 'blue' },
    ],
    points: [
      'Agentic research assistant using LangGraph for multi-step literature review, gap analysis, and summarization.',
      'RAG pipeline over 30+ indexed academic papers using Milvus vector database for semantic retrieval.',
      'Deployed on GKE with Horizontal Pod Autoscaler for concurrent multi-user workloads.',
      'Added multilingual support enabling cross-language academic paper retrieval and translation.',
      'Streamlit UI for interactive paper exploration, citation generation, and export.',
    ],
    tags: ['LangGraph', 'RAG', 'Streamlit', 'GKE', 'Milvus', 'Docker', 'Python'],
  },
  parking: {
    type: 'Project', badge: 'badge-project', org: 'CMU × BOSCH',
    logo: null, live: false,
    title: 'Parking Spot Locator',
    date: 'Aug 2025 – Dec 2025', award: null,
    demo: 'https://psl.fogx.link',
    metrics: [{ label: '3× faster (45s → 15s)', color: 'green' }],
    points: [
      'Bosch-sponsored parking locator using vision-language models and CLIP embeddings for spatial reasoning over sensor data.',
      'Achieved 3× speed improvement (45s → 15s) over traditional visual search baselines.',
      'Deployed inference endpoint on AWS EC2 with FastAPI and async request queuing.',
      'Natural language query interface: "find a spot near the elevator on level 2" returns a highlighted map overlay.',
    ],
    tags: ['VLMap', 'CLIP', 'FastAPI', 'AWS', 'Python'],
  },
  capitawise: {
    type: 'Project', badge: 'badge-project', org: 'Franklin Templeton Hack-a-Thon',
    logo: '/images/ft_logo_pos_0119.png', live: false,
    title: 'Capitawise',
    date: 'Mar – Jun 2024',
    award: '🏆 2nd Place — $7,000 Prize', demo: null,
    metrics: [
      { label: '🏆 2nd Place · $7,000', color: 'amber' },
      { label: '40% faster replies', color: 'amber' },
      { label: '68% → 85% resolution', color: 'amber' },
    ],
    points: [
      'Led full-stack development of an AI banking chatbot for the Franklin Templeton Hackathon, placing 2nd of 20+ competing teams.',
      'GPT-4o dialogue layer over Node.js and Flask services behind a React client.',
      'Cut average response time by 40% and raised first-contact resolution from 68% to 85%.',
    ],
    tags: ['GPT-4o', 'React', 'Node.js', 'Flask', 'OpenAI API'],
  },
  pawprints: {
    type: 'Project', badge: 'badge-project', org: 'Franklin Templeton Hack-a-Thon',
    logo: '/images/ft_logo_pos_0119.png', live: false,
    title: 'PawPrints',
    date: 'Mar – Jun 2023',
    award: '🥇 1st Place — $15,000 Prize', demo: null,
    metrics: [
      { label: '🥇 1st Place · $15,000', color: 'amber' },
      { label: '30+ teams', color: 'amber' },
    ],
    points: [
      'Web3 pet adoption platform for Franklin Templeton Hack-a-Thon, placing 1st of 30+ teams.',
      'Blockchain-based pet identity and adoption history stored on-chain for immutable provenance.',
      'Full-stack application: React.js frontend, Express.js API, MySQL relational database.',
      'Led a team of 4 as product owner and primary full-stack developer.',
    ],
    tags: ['Web3', 'React.js', 'Express.js', 'MySQL', 'Blockchain'],
  },
}
