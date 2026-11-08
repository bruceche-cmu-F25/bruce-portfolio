'use client'

/** The speaker in the corner: sound is off until it's pressed (lib/sound.ts).
 *  A pixel speaker, crossed out when off and with two arcs of sound when on,
 *  drawn on the same 9×7 grid as the section bullets. */

import { useEffect, useState } from 'react'
import { onSoundChange, restoreSound, setSound, soundOn } from '@/lib/sound'

const SPEAKER = 'M3 0h1v7H3V6H2V5H0V2h2V1h1Z'
const WAVES = 'M5 2h1v3H5ZM7 1h1v1h1v3H8v1H7V5h1V2H7Z'
const CROSS = 'M5 2h1v1H5ZM7 2h1v1H7ZM6 3h1v1H6ZM5 4h1v1H5ZM7 4h1v1H7Z'

export default function SoundToggle() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    const off = onSoundChange(setOn)
    const release = restoreSound()
    setOn(soundOn())
    return () => { off(); release() }
  }, [])

  return (
    <button type="button" className="sound" aria-pressed={on} onClick={() => setSound(!on)}
            aria-label={on ? 'Turn sound off' : 'Turn sound on'} title={on ? 'Sound on' : 'Sound off'}>
      <svg viewBox="0 0 9 7" width="18" height="14" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
        <path d={SPEAKER} opacity="0.9" />
        <path d={on ? WAVES : CROSS} opacity={on ? 0.9 : 0.5} />
      </svg>
    </button>
  )
}
