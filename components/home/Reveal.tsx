'use client'

/** Fades each section in as it comes up the page.
 *
 *  One observer for the whole document rather than a wrapper component per
 *  section: anything with `data-reveal` gets `is-in` the first time it shows,
 *  and is then forgotten. The CSS does the rest, and because the hidden state
 *  only applies under `html.reveals`, a visitor without JS — or with reduced
 *  motion, where this never runs — simply sees the page.
 */

import { useEffect } from 'react'

export default function Reveal() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const marks = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!marks.length) return

    document.documentElement.classList.add('reveals')
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 })

    for (const m of marks) io.observe(m)
    return () => { io.disconnect(); document.documentElement.classList.remove('reveals') }
  }, [])

  return null
}
