'use client'

/** A like button for a project, counted for everyone.
 *
 *  The site is static, so the count lives in Abacus
 *  (https://abacus.jasoncameron.dev), a free public counter: `get` reads a
 *  key, `hit` adds one and returns the new total. Bruce chose it over running
 *  a worker of his own, knowing the trade: anyone can call it, and a key
 *  nobody touches for six months expires. Reading on every page view keeps the
 *  keys warm, and if one does lapse the button simply falls back to its seed.
 *
 *  What's shown is the project's seed (lib/home.ts) plus whatever Abacus holds.
 *  A visitor can like each project once — remembered in their own browser —
 *  and there is no unlike, because Abacus can't decrement without an admin
 *  key the page would have to ship.
 *
 *  Every network call fails quietly: the button keeps working off its seed
 *  and the visitor's own like, and the page never waits on a third party.
 */

import { useEffect, useRef, useState } from 'react'
import { Glyph } from '@/components/home/Pixels'

const API = 'https://abacus.jasoncameron.dev'
const NAMESPACE = 'bruceche-com'
const STORE = 'bruceche-liked'

/** One read per key per page, however many times React mounts the button. */
const reads = new Map<string, Promise<number>>()

function read(key: string): Promise<number> {
  let pending = reads.get(key)
  if (!pending) {
    pending = fetch(`${API}/get/${NAMESPACE}/${key}`)
      .then(r => (r.status === 404 ? { value: 0 } : r.ok ? r.json() : Promise.reject(r.status)))
      .then((body: { value?: number }) => (typeof body.value === 'number' && body.value > 0 ? body.value : 0))
      .catch(() => 0)
    reads.set(key, pending)
  }
  return pending
}

function likedSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORE) || '[]')) } catch { return new Set() }
}

function remember(key: string) {
  try {
    const set = likedSet()
    set.add(key)
    localStorage.setItem(STORE, JSON.stringify([...set]))
  } catch { /* private mode: the like still counts, it just won't be remembered */ }
}

export default function Like({ id, title, seed }: { id: string; title: string; seed: number }) {
  const key = `like-${id}`
  const [stored, setStored] = useState(0)
  const [liked, setLiked] = useState(false)
  const [burst, setBurst] = useState(0)
  const busy = useRef(false)

  useEffect(() => {
    setLiked(likedSet().has(key))
    let live = true
    read(key).then(v => { if (live) setStored(s => Math.max(s, v)) })
    return () => { live = false }
  }, [key])

  const count = seed + stored

  const like = () => {
    if (liked || busy.current) return
    busy.current = true
    setBurst(b => b + 1)
    setLiked(true)
    setStored(s => s + 1)
    remember(key)
    fetch(`${API}/hit/${NAMESPACE}/${key}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body: { value?: number }) => {
        // trust the server's total once it answers — it includes everyone else
        if (typeof body.value === 'number') setStored(body.value)
      })
      .catch(() => { /* keep the optimistic +1 */ })
      .finally(() => { busy.current = false })
  }

  return (
    <button type="button" className="like" onClick={like}
            aria-disabled={liked || undefined}
            aria-description={liked ? 'Your like is saved in this browser and cannot be removed.' : 'You can like each project once in this browser.'}
            aria-label={liked ? `You liked ${title} — ${count} likes` : `Like ${title} — ${count} likes`}
            data-liked={liked || undefined}>
      <span className="like-heart" key={burst} data-pop={burst > 0 || undefined}>
        <Glyph name={liked ? 'heart' : 'heartLine'} />
        {burst > 0 && (
          <span className="like-sparks" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => <i key={i} style={{ ['--a' as string]: `${i * 60 + 30}deg` }} />)}
          </span>
        )}
      </span>
      {/* re-keyed on each change, so the new figure rolls up into place */}
      <span className="like-count" key={count} aria-hidden>{count}</span>
    </button>
  )
}
