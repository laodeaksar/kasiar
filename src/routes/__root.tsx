import type { ReactNode } from 'react'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConfirmProvider } from '../components/confirm/confirm-provider'
import { ErrorState } from '../components/feedback'
import { ToastProvider } from '../components/toast/toast-provider'
import type { RouterContext } from '../types/router'
import '../styles/app.css'

const loadTheme = createServerFn({ method: 'GET' }).handler(async () => {
  const { getCookie } = await import('@tanstack/react-start/server')
  const theme = getCookie('tema')
  return theme === 'terang' || theme === 'gelap' ? theme : null
})

function RootDocument({ children, theme }: { children: ReactNode; theme: 'terang' | 'gelap' | null }) {
  const dataTheme = theme === 'terang' ? 'light' : theme === 'gelap' ? 'dark' : undefined
  const colorScheme = theme === 'terang' ? 'light' : theme === 'gelap' ? 'dark' : 'light dark'
  return <html lang="id" data-theme={dataTheme} style={{ colorScheme }}>
    <head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex,nofollow"/><meta name="theme-color" content="light dark"/><HeadContent /></head>
    <body><ConfirmProvider><ToastProvider>{children}</ToastProvider></ConfirmProvider><Scripts /></body>
  </html>
}

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: async () => ({ theme: await loadTheme() }),
  head: () => ({ meta: [{ title: 'Kasiar — Catatan Stok Sembako' }] }),
  component: RootRouteComponent,
  errorComponent: ({ reset }) => <RootDocument theme={null}><main className="mx-auto max-w-2xl p-6"><ErrorState onRetry={reset}/></main></RootDocument>,
  notFoundComponent: () => <RootDocument theme={null}><main className="mx-auto max-w-2xl p-6"><h1 className="text-2xl font-bold">Halaman tidak ditemukan.</h1></main></RootDocument>,
})

function RootRouteComponent() {
  const { theme } = Route.useLoaderData()
  return <RootDocument theme={theme}><Outlet /></RootDocument>
}
