'use client'
import { createContext, useContext, useMemo, useState } from 'react'

type LoaderState = {
  /** 0–100, driven by the hero's real glb download progress */
  progress: number
  /** true once the hero scene is built (or its fallback engaged) */
  ready: boolean
  setProgress: (p: number) => void
  setReady: (r: boolean) => void
}

const LoaderContext = createContext<LoaderState>({
  progress: 0,
  ready: false,
  setProgress: () => {},
  setReady: () => {},
})

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const value = useMemo(() => ({ progress, ready, setProgress, setReady }), [progress, ready])
  return <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
}

export const useLoader = () => useContext(LoaderContext)
