export class ApiError extends Error {
  status: number
  url: string
  body: unknown

  constructor(input: { status: number; url: string; message: string; body: unknown }) {
    super(input.message)
    this.status = input.status
    this.url = input.url
    this.body = input.body
  }
}

function getBaseUrl() {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  return (raw ?? '').replace(/\/$/, '')
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL belum diset. Lihat .env.example')
  }

  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await parseJsonSafe(res)
    const message = typeof body === 'object' && body && 'message' in (body as any) ? String((body as any).message) : res.statusText
    throw new ApiError({ status: res.status, url, message, body })
  }

  const body = await parseJsonSafe(res)
  return body as T
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' })
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' })
}
