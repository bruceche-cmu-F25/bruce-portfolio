import type { Metadata } from 'next'

/** /robin is the old space-themed site, kept for later but not for search:
 *  its copy predates the October 2026 résumé. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function RobinLayout({ children }: { children: React.ReactNode }) {
  return children
}
