'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let instance: Lenis | null = null

/** Lenis drives the page from its own rAF loop, so `body { overflow: hidden }`
 *  does nothing to it — a modal has to stop the instance itself. */
export function setPageScrollLocked(locked: boolean) {
  if (locked) instance?.stop()
  else instance?.start()
}

export default function LenisInit() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis()
    instance = lenis
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)
    return () => {
      instance = null
      lenis.destroy()
    }
  }, [])
  return null
}
