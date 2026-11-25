import * as v from 'valibot'
import { apiFetch } from '../../lib/api'
import type { ListResponse } from '../../types/api'
import { BarangMasukSchema } from '../../validation/barang-masuk'

const BarangMasukRowSchema = v.object({
  id: v.string(),
  tanggal: v.string(),
  waktuDicatat: v.string(),
  namaBarang: v.string(),
  satuan: v.string(),
  jumlahPersepuluh: v.number(),
  hargaBeli: v.number(),
  pemasok: v.nullable(v.string()),
  namaPengguna: v.string(),
})
const ListSchema = v.object({ rows: v.array(BarangMasukRowSchema), total: v.number(), page: v.number(), pageSize: v.number() })
const PilihanSchema = v.array(v.object({ id: v.number(), nama: v.string(), satuan: v.string(), hargaJual: v.number() }))
const SavedSchema = v.object({ id: v.string(), hargaJual: v.number() })
export type BarangMasukRow = v.InferOutput<typeof BarangMasukRowSchema>
export type PilihanBarang = v.InferOutput<typeof PilihanSchema>[number]
export type BarangMasukParams = { q: string; dari: string; sampai: string; halaman: number }
function decodeList(value: unknown): ListResponse<BarangMasukRow> { return v.parse(ListSchema, value) }
function decodePilihan(value: unknown): PilihanBarang[] { return v.parse(PilihanSchema, value) }
function decodeSaved(value: unknown): { id: string; hargaJual: number } { return v.parse(SavedSchema, value) }

export function getBarangMasuk(params: BarangMasukParams) {
  const query = new URLSearchParams({ q: params.q, dari: params.dari, sampai: params.sampai, halaman: String(params.halaman) })
  return apiFetch<ListResponse<BarangMasukRow>>(`/api/barang-masuk?${query}`, decodeList)
}

export function getPilihanBarang(q: string) {
  return apiFetch<PilihanBarang[]>(`/api/barang-masuk/barang?${new URLSearchParams({ q })}`, decodePilihan)
}

export function simpanBarangMasuk(input: unknown, hargaJualDikonfirmasi?: number) {
  const valid = v.parse(BarangMasukSchema, input)
  return apiFetch('/api/barang-masuk', decodeSaved, { method: 'POST', body: JSON.stringify({ ...valid, ...(hargaJualDikonfirmasi === undefined ? {} : { hargaJualDikonfirmasi }) }) })
}
