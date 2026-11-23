import { createServerFn } from '@tanstack/react-start'
import type { ApiError } from '../types/api'

export class ApiRequestError extends Error {
  readonly status: number
  readonly fields: Record<string, string>
  constructor(error: ApiError, status: number) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fields = error.fields
  }
}

const getServerRequestInfo = createServerFn({ method: 'GET' }).handler(async () => {
  const { getRequestHeader, getRequestUrl } = await import('@tanstack/react-start/server')
  return { cookie: getRequestHeader('cookie') ?? '', origin: getRequestUrl().origin }
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function apiFetch<T>(path: string, decode: (payload: unknown) => T, init: RequestInit = {}, cookie?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  let requestUrl = path
  if (typeof window === 'undefined') {
    const request = await getServerRequestInfo()
    const url = new URL(path, request.origin)
    if (url.origin !== request.origin) throw new Error('API hanya boleh dipanggil pada alamat aplikasi yang sama.')
    headers.set('Cookie', cookie ?? request.cookie)
    requestUrl = url.toString()
  }
  const response = await fetch(requestUrl, { ...init, headers, credentials: 'same-origin' })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const source = isRecord(payload) ? payload : {}
    const fields: Record<string, string> = {}
    if (isRecord(source.fields)) {
      for (const [key, message] of Object.entries(source.fields)) if (typeof message === 'string') fields[key] = message
    }
    throw new ApiRequestError({ message: typeof source.message === 'string' ? source.message : 'Permintaan gagal. Silakan coba lagi.', fields }, response.status)
  }
  return decode(payload)
}
