import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import * as v from 'valibot'
import { db } from '../../db'
import { barang, barangMasuk, user } from '../../db/schema'
import { UKURAN_HALAMAN } from '../../lib/konstanta'
import { BarangMasukSchema, isJumlahValidUntukSatuan } from '../../validation/barang-masuk'
import { parseBarangMasukSearch } from '../../validation/search'

export class BarangMasukError extends Error {
  readonly fields: Record<string, string>
  readonly status: 400 | 404 | 409
  readonly warning?: { type: 'harga-beli-di-atas-jual'; hargaBeli: number; hargaJual: number }
  constructor(
    message: string,
    fields: Record<string, string> = {},
    status: 400 | 404 | 409 = 400,
    warning?: { type: 'harga-beli-di-atas-jual'; hargaBeli: number; hargaJual: number },
  ) {
    super(message)
    this.name = 'BarangMasukError'
    this.fields = fields
    this.status = status
    this.warning = warning
  }
}

function fieldErrors(issues: readonly v.BaseIssue<unknown>[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path?.map((part) => String(part.key)).join('.') ?? ''
    if (key && !fields[key]) fields[key] = issue.message
  }
  return fields
}

export async function simpanBarangMasuk(
  input: unknown,
  penggunaId: string,
  hargaJualDikonfirmasi?: number,
) {
  const parsed = v.safeParse(BarangMasukSchema, input)
  if (!parsed.success)
    throw new BarangMasukError('Periksa kembali isian barang masuk.', fieldErrors(parsed.issues))
  const value = parsed.output
  const jumlahPersepuluh = Math.round(value.jumlah * 10)

  return db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: barang.id,
        satuan: barang.satuan,
        hargaJual: barang.hargaJual,
        stok: barang.stok,
        aktif: barang.aktif,
      })
      .from(barang)
      .where(eq(barang.id, value.barangId))
      .for('update')
    if (!item || !item.aktif)
      throw new BarangMasukError(
        'Barang tidak ditemukan atau sudah nonaktif.',
        { barangId: 'Pilih barang yang aktif.' },
        404,
      )
    if (!isJumlahValidUntukSatuan(value.jumlah, item.satuan)) {
      throw new BarangMasukError('Jumlah untuk satuan ini harus bilangan bulat.', {
        jumlah: 'Jumlah harus bilangan bulat untuk satuan ini.',
      })
    }
    if (value.hargaBeli > item.hargaJual && hargaJualDikonfirmasi !== item.hargaJual) {
      throw new BarangMasukError('Periksa harga beli yang lebih tinggi dari harga jual.', {}, 409, {
        type: 'harga-beli-di-atas-jual',
        hargaBeli: value.hargaBeli,
        hargaJual: item.hargaJual,
      })
    }
    if (item.stok + jumlahPersepuluh > 2147483647) {
      throw new BarangMasukError('Jumlah stok terlalu besar.', {
        jumlah: 'Jumlah melebihi batas stok yang dapat disimpan.',
      })
    }
    const [updated] = await tx
      .update(barang)
      .set({ stok: sql`${barang.stok} + ${jumlahPersepuluh}` })
      .where(eq(barang.id, item.id))
      .returning({ stok: barang.stok })
    if (!updated) throw new BarangMasukError('Stok barang tidak dapat diperbarui.', {}, 409)
    const [record] = await tx
      .insert(barangMasuk)
      .values({
        tanggal: value.tanggal,
        barangId: item.id,
        jumlahPersepuluh,
        hargaBeli: value.hargaBeli,
        pemasok: value.pemasok?.trim() || null,
        penggunaId,
      })
      .returning({ id: barangMasuk.id })
    return { id: record.id, hargaJual: item.hargaJual }
  })
}

export async function cariPilihanBarang(query: unknown) {
  const q = typeof query === 'string' ? query.trim().slice(0, 100) : ''
  const where = q
    ? and(eq(barang.aktif, true), ilike(barang.nama, `%${q.replace(/[\\%_]/g, '\\$&')}%`))
    : eq(barang.aktif, true)
  return db
    .select({
      id: barang.id,
      nama: barang.nama,
      satuan: barang.satuan,
      hargaJual: barang.hargaJual,
    })
    .from(barang)
    .where(where)
    .orderBy(barang.nama, barang.id)
    .limit(20)
}

export async function daftarBarangMasuk(search: unknown) {
  const params = parseBarangMasukSearch(search)
  const filters = []
  if (params.q) {
    const q = `%${params.q.replace(/[\\%_]/g, '\\$&')}%`
    filters.push(or(ilike(barang.nama, q), ilike(barangMasuk.pemasok, q)))
  }
  if (params.dari) filters.push(sql`${barangMasuk.tanggal} >= ${params.dari}::date`)
  if (params.sampai) filters.push(sql`${barangMasuk.tanggal} <= ${params.sampai}::date`)
  const where = filters.length ? and(...filters) : undefined
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(barangMasuk)
    .innerJoin(barang, eq(barangMasuk.barangId, barang.id))
    .where(where)
  const page = Math.min(params.halaman, Math.max(1, Math.ceil(total / UKURAN_HALAMAN)))
  const rows = await db
    .select({
      id: barangMasuk.id,
      tanggal: barangMasuk.tanggal,
      waktuDicatat: barangMasuk.waktuDicatat,
      namaBarang: barang.nama,
      satuan: barang.satuan,
      jumlahPersepuluh: barangMasuk.jumlahPersepuluh,
      hargaBeli: barangMasuk.hargaBeli,
      pemasok: barangMasuk.pemasok,
      namaPengguna: user.name,
    })
    .from(barangMasuk)
    .innerJoin(barang, eq(barangMasuk.barangId, barang.id))
    .innerJoin(user, eq(barangMasuk.penggunaId, user.id))
    .where(where)
    .orderBy(
      desc(barangMasuk.tanggal),
      desc(barangMasuk.waktuDicatat),
      desc(barangMasuk.createdAt),
      desc(barangMasuk.id),
    )
    .limit(UKURAN_HALAMAN)
    .offset((page - 1) * UKURAN_HALAMAN)
  return { rows, total, page, pageSize: UKURAN_HALAMAN }
}
