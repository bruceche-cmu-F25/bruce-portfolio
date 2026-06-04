export interface Metric { label: string; color: 'green' | 'blue' | 'amber' }

export interface BentoEntry {
  type: string; badge: string; org: string
  logo: string | null; live: boolean
  title: string; date: string
  award: string | null; demo: string | null
  metrics: Metric[]; points: string[]; tags: string[]
}

export const bentoDetails: Record<string, BentoEntry> = {
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
      'Led product strategy for an AI-driven call assistant across mortgage, healthcare, insurance, and government verticals.',
      'Migrated intent-matching from Dialogflow to Gemini 2.0 + Vertex AI, reducing per-match cost by 6× while improving accuracy.',
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
  convoloo: {
    type: 'Work', badge: 'badge-work', org: 'Convoloo',
    logo: '/images/convoloo_logo.jpeg', live: false,
    title: 'Software Development Engineer Intern',
    date: 'Jul 2024 – Sep 2024', award: null, demo: null,
    metrics: [
      { label: '2.5s → 1.5s response', color: 'green' },
      { label: '50+ confirmed bookings', color: 'green' },
    ],
    points: [
      'Built AI event-matching feature with LangChain, reducing average query response time from 2.5s to 1.5s.',
      'Architected GCP cloud infrastructure with Terraform for scalable, reproducible deployments.',
      'Implemented full-stack features across React + FastAPI powering 50+ confirmed user bookings.',
      'Designed and maintained MySQL database schema for events, users, and availability management.',
    ],
    tags: ['LangChain', 'FastAPI', 'React', 'GCP', 'Terraform', 'MySQL'],
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
    date: 'Aug – Dec 2025', award: null,
    demo: 'https://psl.fogx.link',
    metrics: [{ label: '3× faster (45s → 15s)', color: 'green' }],
    points: [
      'Vision-language parking spot locator using VLMap + CLIP for semantic, natural-language-queryable maps.',
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
      { label: '20+ teams', color: 'amber' },
    ],
    points: [
      'AI-powered financial advisor for Franklin Templeton Hack-a-Thon, placing 2nd of 20+ competing teams.',
      'GPT-4o integration for personalized investment strategy recommendations based on user risk profile.',
      'Interactive portfolio analysis dashboard built with React + Node.js with real-time charting.',
      'Flask backend with live market data ingestion and portfolio rebalancing suggestions.',
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
