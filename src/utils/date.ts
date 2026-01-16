export function isoNow() {
  return new Date().toISOString()
}

export function toMonthKey(isoDate: string) {
  const d = new Date(isoDate)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

export function formatDate(isoDate: string) {
  const d = new Date(isoDate)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}
