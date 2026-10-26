/** Little die-cut badges for each way to reach me — the brand's own mark where
 *  there is one. Each is its own link, so it can be clicked or dragged off. */

import type { ReactNode } from 'react'

export type LogoKind = 'email' | 'linkedin' | 'github' | 'phone' | 'resume'

/** GitHub's mark: simple-icons, CC0. */
const GITHUB =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const MARKS: Record<LogoKind, { bg: string; tilt: number; mark: ReactNode }> = {
  github: { bg: '#181717', tilt: -5, mark: <path d={GITHUB} fill="#fff" transform="translate(3 3) scale(0.75)" /> },
  // LinkedIn's "in", drawn to its proportions (simple-icons no longer carries it)
  linkedin: {
    bg: '#0a66c2', tilt: 4,
    mark: (
      <g fill="#fff">
        <circle cx="7.6" cy="7.4" r="1.75" />
        <rect x="6.1" y="10.1" width="3" height="8.4" />
        <path d="M11.1 10.1h2.85v1.25c.45-.8 1.5-1.45 2.9-1.45 2.55 0 3.05 1.65 3.05 3.8v4.8h-2.95v-4.25c0-1-.02-2.3-1.42-2.3-1.42 0-1.63 1.1-1.63 2.23v4.32H11.1z" />
      </g>
    ),
  },
  email: {
    bg: '#c8372c', tilt: -3,
    mark: (
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round">
        <rect x="4.5" y="7" width="15" height="10.5" rx="1.4" />
        <path d="M5 7.8l7 5.2 7-5.2" />
      </g>
    ),
  },
  phone: {
    bg: '#3b8a5a', tilt: 5,
    mark: (
      <path fill="#fff" d="M8.2 4.8c.5-.2 1 0 1.3.5l1.4 2.6c.3.5.2 1-.2 1.4l-1.2 1c.8 1.7 2.1 3 3.8 3.9l1-1.2c.4-.4.9-.5 1.4-.3l2.7 1.3c.5.3.7.8.5 1.3l-.6 1.9c-.2.6-.8 1-1.4 1C10.7 18 6 13.3 5.8 7.3c0-.6.4-1.2 1-1.4z" />
    ),
  },
  resume: {
    bg: '#e0a91c', tilt: -4,
    mark: (
      <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4.5h7l3.5 3.5v11.5H7z" />
        <path d="M14 4.5V8h3.5M9.5 12h5.5M9.5 15h5.5" />
      </g>
    ),
  },
}

export function Logo({ kind, href, label, download }: { kind: LogoKind; href: string; label: string; download?: boolean }) {
  const { bg, tilt, mark } = MARKS[kind]
  const external = href.startsWith('http')
  return (
    <a className={`nb-logo nb-logo-${kind}`} href={href} aria-label={label} download={download || undefined}
       target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined}
       style={{ ['--logo-bg' as string]: bg, ['--logo-tilt' as string]: `${tilt}deg` }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{mark}</svg>
    </a>
  )
}
