'use client'
/** Dust drifting through the lamp's beam, at night. The specks are all through
 *  the air but only show where the beam catches them: brighter toward its middle
 *  and toward the lamp, along the same cone the CSS draws (.nb-beam's --src-x,
 *  --src-y, --beam-from, --beam-width, read back from it). It runs only while
 *  the lights are out and the page is in view; with reduced motion it holds still. */

import { useEffect, useRef } from 'react'

type Speck = { x: number; y: number; vx: number; vy: number; size: number; bright: number; phase: number }

export function LampDust() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!
    const root = canvas.closest<HTMLElement>('.nb')!
    const beamEl = root.querySelector<HTMLElement>('.nb-beam')!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0
    const beam = { sx: 0, sy: 0, from: 0, width: 1, reach: 1 }
    let specks: Speck[] = []
    let frame = 0, last = 0

    /** How brightly the beam catches a point: 0 outside the cone, 1 in its middle by the lamp. */
    const lit = (x: number, y: number) => {
      const dx = x - beam.sx, dy = y - beam.sy
      const angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360   // clockwise from straight up
      const u = (angle - beam.from) / beam.width
      if (u <= 0 || u >= 1) return 0
      // the CSS mask: across, the cone's edges soften over its outer 22% each side;
      // along, full to 10% of the way out, half at 50%, gone at 95%
      const across = Math.min(1, u / 0.22, (1 - u) / 0.22)
      const d = Math.hypot(dx, dy) / beam.reach
      const along = d < 0.1 ? 1 : d < 0.5 ? 1 - ((d - 0.1) / 0.4) * 0.5 : Math.max(0, 0.5 * (1 - (d - 0.5) / 0.45))
      return across * along
    }

    // one soft speck, drawn once and stamped at every size
    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 32
    const s = sprite.getContext('2d')!, glow = s.createRadialGradient(16, 16, 0, 16, 16, 16)
    glow.addColorStop(0, 'rgba(255, 242, 214, 1)')
    glow.addColorStop(0.35, 'rgba(255, 228, 182, 0.5)')
    glow.addColorStop(1, 'rgba(255, 220, 160, 0)')
    s.fillStyle = glow
    s.fillRect(0, 0, 32, 32)

    /** A speck somewhere the beam reaches; some are out of focus — bigger and fainter. */
    const speck = (): Speck => {
      let x = 0, y = 0
      for (let tries = 0; tries < 40; tries++) {
        x = Math.random() * W
        y = Math.random() * H
        if (lit(x, y) > 0.08) break
      }
      const blurred = Math.random() < 0.22
      return {
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: 1 + Math.random() * 4,
        size: blurred ? 6 + Math.random() * 8 : 2 + Math.random() * 3,
        bright: blurred ? 0.16 + Math.random() * 0.12 : 0.45 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }
    }

    /** Where the beam is now (the CSS moves it between a desk and a phone) and how much air it lights. */
    const measure = () => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      W = innerWidth
      H = innerHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const css = getComputedStyle(beamEl), num = (name: string) => parseFloat(css.getPropertyValue(name))
      beam.sx = (W * num('--src-x')) / 100
      beam.sy = (H * num('--src-y')) / 100
      beam.from = num('--beam-from')
      beam.width = num('--beam-width')
      beam.reach = Math.hypot(W - beam.sx, H - beam.sy)
      specks = Array.from({ length: Math.round(Math.min(110, (W * H) / 13000)) }, speck)
    }

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, W, H)
      for (const p of specks) {
        p.phase += dt * 0.7
        p.x += (p.vx + Math.sin(p.phase) * 3) * dt
        p.y += (p.vy + Math.cos(p.phase * 0.8) * 2) * dt
        const light = lit(p.x, p.y)
        // drifted off the screen, or out of the light for good: another takes its place
        if (p.x < -20 || p.x > W + 20 || p.y > H + 20 || (light === 0 && Math.random() < 0.01)) Object.assign(p, speck())
        // a glint now and then as it turns
        const alpha = p.bright * light * (0.75 + 0.25 * Math.sin(p.phase * 2.3))
        if (alpha < 0.01) continue
        ctx.globalAlpha = alpha
        ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
    }
    const tick = (now: number) => {
      draw(Math.min(0.05, (now - last) / 1000))
      last = now
      frame = requestAnimationFrame(tick)
    }

    /** On while the lights are out and the page can be seen; otherwise the canvas fades out as it was. */
    const sync = () => {
      cancelAnimationFrame(frame)
      if (!document.documentElement.hasAttribute('data-night') || document.hidden) return
      if (reduced) { draw(0); return }
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    measure()
    sync()
    const lights = new MutationObserver(sync)
    lights.observe(document.documentElement, { attributes: true, attributeFilter: ['data-night'] })
    // a phone and a desk hold the beam at different angles
    const layout = new MutationObserver(() => { measure(); sync() })
    layout.observe(root, { attributes: true, attributeFilter: ['data-layout'] })
    const onResize = () => { measure(); sync() }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', sync)
    return () => {
      cancelAnimationFrame(frame)
      lights.disconnect()
      layout.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return <canvas className="nb-dust" ref={ref} aria-hidden="true" />
}
