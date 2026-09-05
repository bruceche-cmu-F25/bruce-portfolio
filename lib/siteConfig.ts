/** Single source of truth for contact details and profile links.
 *  Every component reads from here — never hardcode an address or handle again. */
export const SITE = {
  email: 'bruceche@andrew.cmu.edu',
  phone: '858-305-0278',
  phoneHref: 'tel:+18583050278',
  github: 'https://github.com/bruceche-cmu-F25',
  githubHandle: 'bruceche-cmu-F25',
  linkedin: 'https://linkedin.com/in/chi-cheng-779b4a259/',
  linkedinHandle: 'chi-cheng-779b4a259',
  resume: '/Chi Cheng-Resume-2026-August.pdf',
} as const
