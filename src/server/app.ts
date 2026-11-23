import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { auth } from '../lib/auth'
type Env = { Variables: { user: { id: string; role: string } } }
export const requireLogin = createMiddleware<Env>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ message: 'Silakan masuk terlebih dahulu.', fields: {} }, 401)
  c.set('user', { id: session.user.id, role: String((session.user as typeof session.user & { role?: string }).role ?? 'kasir') })
  await next()
})
export const requireAdmin = createMiddleware<Env>(async (c, next) => {
  if (c.get('user').role !== 'admin') return c.json({ message: 'Akses khusus admin.', fields: {} }, 403)
  await next()
})
export const app = new Hono<Env>()
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
app.use('/api/*', requireLogin)
app.get('/api/session', (c) => c.json({ user: c.get('user') }))
app.use('/api/admin/*', requireAdmin)
app.all('*', (c) => c.json({ message: 'Endpoint tidak ditemukan.', fields: {} }, 404))
