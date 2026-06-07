'use client'

import { useEffect, useRef, useState } from 'react'
import { fmtTokens } from '@/lib/format'

export function CountUp({ to, durationMs = 1100 }: { to: number; durationMs?: number }) {
  const [val, setVal] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(to)
      return
    }
    function tick(t: number) {
      if (startRef.current === null) startRef.current = t
      const p = Math.min(1, (t - startRef.current) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setVal(to * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startRef.current = null
    }
  }, [to, durationMs])

  return <span className="tabular-nums">{fmtTokens(Math.round(val))}</span>
}
