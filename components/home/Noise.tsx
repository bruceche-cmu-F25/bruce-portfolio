'use client'

import { useEffect, useRef } from 'react'

const TILE = 256
const FRAME_MS = 1000 / 24

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const generator = (seed: number) => {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const paintTile = () => {
  const tile = document.createElement('canvas')
  tile.width = tile.height = TILE
  const context = tile.getContext('2d')
  if (!context) return null

  const image = context.createImageData(TILE, TILE)
  const random = generator(1013904223)
  const range = 0.5 + 0.3 * 1.1
  for (let index = 0; index < image.data.length; index += 4) {
    const value = clamp01(0.5 + (random() + random() - 1) * range) * 255
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return tile
}

export default function Noise() {
  const grain = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = grain.current
    const tile = paintTile()
    if (!element || !tile) return

    let alive = true
    let url = ''
    tile.toBlob(blob => {
      if (!alive || !blob) return
      url = URL.createObjectURL(blob)
      element.style.backgroundImage = `url("${url}")`
      element.dataset.ready = 'true'
    })

    const still = new URLSearchParams(location.search).has('still')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let lastFrame = 0
    let visible = true

    const tick = (now: number) => {
      frame = 0
      if (!visible || document.hidden || motion.matches || still) return
      if (now - lastFrame >= FRAME_MS) {
        element.style.backgroundPosition = `${Math.floor(Math.random() * TILE)}px ${Math.floor(Math.random() * TILE)}px`
        lastFrame = now - ((now - lastFrame) % FRAME_MS)
      }
      frame = requestAnimationFrame(tick)
    }
    const wake = () => {
      if (!frame && visible && !document.hidden && !motion.matches && !still) frame = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      if (visible) wake()
    })
    observer.observe(element)
    document.addEventListener('visibilitychange', wake)
    motion.addEventListener('change', wake)
    wake()

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', wake)
      motion.removeEventListener('change', wake)
      delete element.dataset.ready
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  return <div ref={grain} className="scene-noise" aria-hidden="true" />
}
