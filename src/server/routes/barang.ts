import { Hono } from 'hono'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '../../db'
import { barang, barangMasuk, riwayatHargaJual } from '../../db/schema'
import { STATUS_BARANG_BAWAAN, UKURAN_HALAMAN } from '../../lib/konstanta'
import {
  BarangSchema,
  BarangUbahSchema,
  parseBarangListSearch,
  parseBarangSearch,
} from '../../validation/barang'
import * as v from 'valibot'
type Env = { Variables: { user: { id: string; role: string } } }
const admin = new Hono<Env>()
const reader = new Hono<Env>()
function fieldErrors(issues: readonly v.BaseIssue<unknown>[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path?.map((part: { key: unknown }) => String(part.key)).join('.') ?? ''
    if (key && !fields[key]) fields[key] = issue.message
  }
  return fields
}
function parsePage(value: unknown) {
  const params = parseBarangSearch(value)
  return params
}
reader.get('/', async (c) => {
  const params = parseBarangListSearch({ q: c.req.query('q'), halaman: c.req.query('halaman') })
  const where = params.q
    ? and(eq(barang.aktif, true), ilike(barang.nama, `%${params.q.replace(/[\\%_]/g, '\\$&')}%`))
    : eq(barang.aktif, true)
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(barang)
    .where(where)
  const rows = await db
    .select({
      id: barang.id,
      nama: barang.nama,
      satuan: barang.satuan,
      hargaJual: barang.hargaJual,
      stok: barang.stok,
      aktif: barang.aktif,
    })
    .from(barang)
    .where(where)
    .orderBy(barang.nama, barang.id)
    .limit(UKURAN_HALAMAN)
    .offset((params.halaman - 1) * UKURAN_HALAMAN)
  const page =
    Math.max(1, Math.ceil(total / UKURAN_HALAMAN)) < params.halaman
      ? Math.max(1, Math.ceil(total / UKURAN_HALAMAN))
      : params.halaman
  const safeRows =
    page !== params.halaman
      ? await db
          .select({
            id: barang.id,
            nama: barang.nama,
            satuan: barang.satuan,
            hargaJual: barang.hargaJual,
            stok: barang.stok,
            aktif: barang.aktif,
          })
          .from(barang)
          .where(where)
          .orderBy(barang.nama, barang.id)
          .limit(UKURAN_HALAMAN)
          .offset((page - 1) * UKURAN_HALAMAN)
      : rows
  return c.json({ rows: safeRows, total, page, pageSize: UKURAN_HALAMAN })
})
admin.get('/', async (c) => {
  const params = parsePage({
    q: c.req.query('q'),
    halaman: c.req.query('halaman'),
    status: c.req.query('status'),
  })
  const filters = []
  if (params.q) filters.push(ilike(barang.nama, `%${params.q.replace(/[\\%_]/g, '\\$&')}%`))
  if (params.status !== 'semua')
    filters.push(eq(barang.aktif, params.status === STATUS_BARANG_BAWAAN))
  const where = filters.length ? and(...filters) : undefined
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(barang)
    .where(where)
  const page = Math.min(params.halaman, Math.max(1, Math.ceil(total / UKURAN_HALAMAN)))
  const rows = await db
    .select({
      id: barang.id,
      nama: barang.nama,
      satuan: barang.satuan,
      hargaJual: barang.hargaJual,
      stok: barang.stok,
      aktif: barang.aktif,
      hargaBeliTerakhir: sql<
        number | null
      >`(select bm.harga_beli from barang_masuk bm where bm.barang_id = ${barang.id} order by bm.waktu_dicatat desc, bm.created_at desc limit 1)`,
    })
    .from(barang)
    .where(where)
    .orderBy(barang.nama, barang.id)
    .limit(UKURAN_HALAMAN)
    .offset((page - 1) * UKURAN_HALAMAN)
  return c.json({ rows, total, page, pageSize: UKURAN_HALAMAN })
})
admin.post('/', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  const result = v.safeParse(BarangSchema, body)
  if (!result.success)
    return c.json(
      { message: 'Periksa kembali isian barang.', fields: fieldErrors(result.issues) },
      400,
    )
  const actor = c.get('user')
  const added = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(barang)
      .values({ ...result.output, stok: 0, aktif: true })
      .returning()
    await tx
      .insert(riwayatHargaJual)
      .values({ barangId: created.id, hargaJual: created.hargaJual, adminId: actor.id })
    return created
  })
  return c.json({ id: added.id }, 201)
})
admin.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isSafeInteger(id) || id < 1)
    return c.json({ message: 'Barang tidak ditemukan.', fields: {} }, 404)
  const body: unknown = await c.req.json().catch(() => null)
  const result = v.safeParse(BarangUbahSchema, {
    ...(typeof body === 'object' && body !== null ? body : {}),
    id,
  })
  if (!result.success)
    return c.json(
      { message: 'Periksa kembali perubahan barang.', fields: fieldErrors(result.issues) },
      400,
    )
  const { id: _id, ...changes } = result.output
  const keys = Object.keys(changes)
  if (!keys.length)
    return c.json({ message: 'Tidak ada perubahan untuk disimpan.', fields: {} }, 400)
  const actor = c.get('user')
  const updated = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(barang).where(eq(barang.id, id)).for('update')
    if (!current) return null
    const [row] = await tx.update(barang).set(changes).where(eq(barang.id, id)).returning()
    if (changes.hargaJual !== undefined && changes.hargaJual !== current.hargaJual)
      await tx
        .insert(riwayatHargaJual)
        .values({ barangId: id, hargaJual: changes.hargaJual, adminId: actor.id })
    const [last] = await tx
      .select({ hargaBeli: barangMasuk.hargaBeli })
      .from(barangMasuk)
      .where(eq(barangMasuk.barangId, id))
      .orderBy(desc(barangMasuk.waktuDicatat), desc(barangMasuk.createdAt))
      .limit(1)
    return { row, hargaBeliTerakhir: last?.hargaBeli ?? null }
  })
  if (!updated) return c.json({ message: 'Barang tidak ditemukan.', fields: {} }, 404)
  return c.json(updated)
})
export { admin as adminBarangRoutes, reader as barangRoutes }
