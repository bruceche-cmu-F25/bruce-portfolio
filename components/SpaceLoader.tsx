'use client'
import { useEffect, useState } from 'react'
import { useLoader } from '@/lib/LoaderContext'

/** First-load gate: black screen, serif name, gold hairline bound to the
 *  hero's real glb download progress. Fades out when the scene is ready. */
export default function SpaceLoader() {
  const { progress, ready } = useLoader()
  const [forced, setForced] = useState(false)
  const [gone, setGone] = useState(false)

  // failsafe: never trap the visitor behind the loader
  useEffect(() => {
    const t = setTimeout(() => setForced(true), 12000)
    return () => clearTimeout(t)
  }, [])

  const done = ready || forced
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 950) // matches the CSS fade
    return () => clearTimeout(t)
  }, [done])

  if (gone) return null
  return (
    <div className={`space-loader${done ? ' is-done' : ''}`} role="status" aria-label="Loading">
      <p className="sl-eyebrow">Portfolio</p>
      <div className="sl-name">Bruce Cheng</div>
      <div className="sl-bar" aria-hidden="true">
        <i style={{ width: `${done ? 100 : Math.max(4, progress)}%` }} />
      </div>
    </div>
  )
}
