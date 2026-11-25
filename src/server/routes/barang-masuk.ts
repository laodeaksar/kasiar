import { Hono } from 'hono'
import { BarangMasukError, cariPilihanBarang, daftarBarangMasuk, simpanBarangMasuk } from '../services/barang-masuk'

type Env = { Variables: { user: { id: string; role: string } } }
export const barangMasukRoutes = new Hono<Env>()

barangMasukRoutes.get('/barang', async (c) => {
  const rows = await cariPilihanBarang(c.req.query('q'))
  return c.json(rows)
})

barangMasukRoutes.get('/', async (c) => {
  const result = await daftarBarangMasuk({
    q: c.req.query('q'),
    dari: c.req.query('dari'),
    sampai: c.req.query('sampai'),
    halaman: c.req.query('halaman'),
  })
  return c.json(result)
})

barangMasukRoutes.post('/', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  try {
    const confirmation = typeof body === 'object' && body !== null && 'hargaJualDikonfirmasi' in body
      ? (body as { hargaJualDikonfirmasi?: unknown }).hargaJualDikonfirmasi
      : undefined
    const hargaJualDikonfirmasi = typeof confirmation === 'number' && Number.isInteger(confirmation) ? confirmation : undefined
    const result = await simpanBarangMasuk(body, c.get('user').id, hargaJualDikonfirmasi)
    return c.json(result, 201)
  } catch (error) {
    if (error instanceof BarangMasukError) {
      return c.json({ message: error.message, fields: error.fields, ...(error.warning ? { warning: error.warning } : {}) }, error.status)
    }
    throw error
  }
})
