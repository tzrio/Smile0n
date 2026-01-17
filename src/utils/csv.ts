/**
 * Lightweight CSV utilities used by all "Export CSV" actions.
 * Includes UTF-8 BOM so Excel opens Indonesian text correctly.
 */
export type CsvColumn<T> = {
  header: string
  value: (row: T) => unknown
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  const needsQuotes = /[",\n\r]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map((c) => escapeCsvValue(c.header)).join(',')
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(','))
  // Add UTF-8 BOM so Excel opens Indonesian text correctly.
  return `\uFEFF${[headerLine, ...lines].join('\r\n')}`
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const csv = buildCsv(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()

  // Revoke async so the download can start.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
