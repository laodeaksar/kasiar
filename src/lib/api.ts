import { createServerFn } from '@tanstack/react-start'
import type { ApiError as ApiErrorContract } from '../types/api'

export class ApiError extends Error implements ApiErrorContract {
  readonly status: number
  readonly fields: Record<string, string>
  readonly details?: unknown

  constructor(error: ApiErrorContract) {
    super(error.message)
    this.name = 'ApiError'
    this.status = error.status
    this.fields = error.fields
    this.details = error.details
  }
}

// Alias kompatibilitas untuk komponen lama selama pola Query diterapkan.
export { ApiError as ApiRequestError }

export class ApiNetworkError extends Error {
  constructor() {
    super('Koneksi internet terputus. Periksa jaringan Anda.')
    this.name = 'ApiNetworkError'
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

  let response: Response
  try {
    response = await fetch(requestUrl, { ...init, headers, credentials: 'same-origin' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiNetworkError()
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const source = isRecord(payload) ? payload : {}
    const fields: Record<string, string> = {}
    if (isRecord(source.fields)) {
      for (const [key, message] of Object.entries(source.fields)) if (typeof message === 'string') fields[key] = message
    }
    const details = source.warning ?? source.details
    throw new ApiError({
      status: response.status,
      message: typeof source.message === 'string' ? source.message : 'Permintaan gagal. Silakan coba lagi.',
      fields,
      ...(details === undefined ? {} : { details }),
    })
  }
  return decode(payload)
}
