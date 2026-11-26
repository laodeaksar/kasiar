import { Hono } from 'hono'
import { catatPelunasan, daftarUtang, rincianUtang, UtangError } from '../services/utang'

type Env = { Variables: { user: { id: string; role: string } } }
export const utangRoutes = new Hono<Env>()

utangRoutes.get('/', async (c) => {
  const result = await daftarUtang({
    q: c.req.query('q'),
    status: c.req.query('status'),
    halaman: c.req.query('halaman'),
  })
  return c.json(result)
})

utangRoutes.get('/:pembeliId', async (c) => {
  try {
    return c.json(await rincianUtang(c.req.param('pembeliId')))
  } catch (error) {
    if (error instanceof UtangError)
      return c.json({ message: error.message, fields: error.fields }, error.status)
    throw error
  }
})

utangRoutes.post('/pelunasan', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  try {
    return c.json(await catatPelunasan(body, c.get('user').id), 201)
  } catch (error) {
    if (error instanceof UtangError)
      return c.json({ message: error.message, fields: error.fields }, error.status)
    throw error
  }
})
