import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import type { RouterContext } from './types/router'

export function getRouter() {
  const queryClient = new QueryClient()
  return createRouter({ routeTree, context: { queryClient, session: null } satisfies RouterContext, defaultPreload: 'intent' })
}

declare module '@tanstack/react-router' {
  interface Register { router: ReturnType<typeof getRouter> }
}
