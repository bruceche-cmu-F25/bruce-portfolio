import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Notebook from '@/components/notebook/Notebook'
import { SITE } from '@/lib/siteConfig'
import './notebook.css'

/** Excalidraw's hand. OFL-1.1 — the licence ships beside the font file. */
const virgil = localFont({
  src: './fonts/Virgil.woff2',
  variable: '--font-virgil',
  display: 'block',
})

/** Courier Prime, for the facts typed into the notebook (Latin subset). OFL-1.1, licence beside it. */
const typewriter = localFont({
  src: './fonts/CourierPrime-Regular.woff2',
  variable: '--font-typewriter',
  display: 'block',
})

const TITLE = 'Bruce Cheng · Portfolio'
// what a search result or a shared link says under the title — kept under ~160 characters
const DESCRIPTION = 'MS SE at CMU Silicon Valley. I build agentic systems and the backends that keep them fast. Open to new-grad SWE, FDE and AI roles from Dec 2026.'

/** The share preview is the closed notebook on the desk — /og.jpg, shot from
 *  this page with ?still by scripts/og-image.sh. Re-run it when the cover changes. */
const PREVIEW = {
  url: '/og.jpg',
  width: 1200,
  height: 630,
  alt: 'A closed kraft notebook labelled "Bruce Cheng — notebook · 2026", covered in stickers, on a desk beside a coffee mug, a pencil and two sticky notes',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', siteName: 'Bruce Cheng', title: TITLE, description: DESCRIPTION, images: [PREVIEW] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [PREVIEW.url] },
}

/** Who the site is about, for search engines: schema.org's Person. */
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

export default function Page() {
  return (
    <div className={`${virgil.variable} ${typewriter.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
      {/* WeChat ignores og:image when a link is pasted into a chat and takes the
          first large image in the page instead — so the preview comes first. */}
      <img src={PREVIEW.url} alt="" hidden width={PREVIEW.width} height={PREVIEW.height} />
      <Notebook />
    </div>
  )
}
