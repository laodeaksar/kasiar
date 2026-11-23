import type { QueryClient } from '@tanstack/react-query'

export type UserSession = { id: string; username: string; peran: 'admin' | 'kasir' } | null

export type RouterContext = {
  queryClient: QueryClient
  session: UserSession
  sessionCookiePresent: boolean
}
