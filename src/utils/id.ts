function pad2(n: number) {
  return `${n}`.padStart(2, '0')
}

function randomToken(len = 6) {
  // Prefer crypto for better uniqueness
  try {
    const bytes = new Uint8Array(Math.ceil(len / 2))
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, len)
      .toUpperCase()
  } catch {
    return Math.random().toString(16).slice(2, 2 + len).toUpperCase()
  }
}

function prefixCode(prefix: string) {
  const p = prefix.toLowerCase()
  if (p === 'emp') return 'EMP'
  if (p === 'prd') return 'PRD'
  if (p === 'stk') return 'STK'
  if (p === 'trx') return 'TRX'
  return prefix.toUpperCase()
}

export function createId(prefix: string) {
  const d = new Date()
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  return `${prefixCode(prefix)}-${y}${m}${day}-${randomToken(6)}`
}
