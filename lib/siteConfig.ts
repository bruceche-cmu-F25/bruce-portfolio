/** Single source of truth for contact details and profile links.
 *  Every component reads from here — never hardcode an address or handle again. */
export const SITE = {
  /** where the site is served — canonical links, the sitemap and structured data are built from it */
  url: 'https://www.bruceche.com',
  email: 'bruceche@andrew.cmu.edu',
  phone: '858-305-0278',
  phoneHref: 'tel:+18583050278',
  github: 'https://github.com/bruceche-cmu-F25',
  githubHandle: 'bruceche-cmu-F25',
  linkedin: 'https://www.linkedin.com/in/chi-cheng921/',
  linkedinHandle: 'chi-cheng921',
  resume: '/Chi_Cheng_Oct_2026_CV.pdf',
} as const
