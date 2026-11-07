'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

export type LogoLoopItem = {
  label: string
  icon: string
  core?: boolean
}

type LogoLoopProps = {
  logos: LogoLoopItem[]
  speed?: number
  gap?: number
  ariaLabel?: string
}

export default function LogoLoop({ logos, speed = 36, gap = 28, ariaLabel = 'Technology stack' }: LogoLoopProps) {
  const firstList = useRef<HTMLUListElement>(null)
  const [duration, setDuration] = useState(32)

  useEffect(() => {
    const list = firstList.current
    if (!list || !speed) return

    const measure = () => setDuration(list.scrollWidth / Math.abs(speed))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [speed, gap, logos])

  const style = {
    '--logo-loop-gap': `${gap}px`,
    '--logo-loop-duration': `${duration}s`,
  } as CSSProperties

  return (
    <div className="logo-loop" role="region" aria-label={ariaLabel} tabIndex={0} style={style}>
      <div className="logo-loop__track">
        {[false, true].map(copy => (
          <ul key={String(copy)} className="logo-loop__list" ref={copy ? undefined : firstList} aria-hidden={copy || undefined}>
            {logos.map(item => (
              <li key={item.label} className="logo-loop__item" data-core={item.core || undefined} data-icon={item.icon}>
                <span className="logo-loop__mark" aria-hidden="true">
                  <img src={`/logos/stack/${item.icon}.svg`} alt="" width="24" height="24" loading="lazy" decoding="async" draggable={false} />
                </span>
                <span className="logo-loop__label">{item.label}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
