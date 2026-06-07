'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { isReliableMonth } from '@/lib/config'

export function MonthPicker({ months, current }: { months: string[]; current: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  if (months.length === 0) return null
  return (
    <select
      className="border border-border rounded-lg px-3 py-1.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
      value={current}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString())
        p.set('month', e.target.value)
        router.push(`/?${p.toString()}`)
      }}
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {m}{isReliableMonth(m) ? '' : '（参考）'}
        </option>
      ))}
    </select>
  )
}
