'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function MonthPicker({ months, current }: { months: string[]; current: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  if (months.length === 0) return null
  return (
    <select
      className="border border-gray-300 rounded px-2 py-1 text-sm"
      value={current}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString())
        p.set('month', e.target.value)
        router.push(`/?${p.toString()}`)
      }}
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  )
}
