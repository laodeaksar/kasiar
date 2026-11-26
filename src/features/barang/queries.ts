import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '../../lib/api'
import type { ListResponse } from '../../types/api'

const BarangRowSchema = v.object({ id: v.number(), nama: v.string(), satuan: v.string(), hargaJual: v.number(), stok: v.number(), aktif: v.boolean(), hargaBeliTerakhir: v.optional(v.nullable(v.number())) })
const BarangListSchema = v.object({ rows: v.array(BarangRowSchema), total: v.number(), page: v.number(), pageSize: v.number() })
export type BarangRow = v.InferOutput<typeof BarangRowSchema>
export type BarangParams = { q: string; halaman: number; status?: 'aktif' | 'nonaktif' | 'semua' }

export const barangKeys = {
  all: ['barang'] as const,
  lists: () => [...barangKeys.all, 'daftar'] as const,
  list: (params: BarangParams, admin: boolean) => [...barangKeys.lists(), { ...params, admin }] as const,
  details: () => [...barangKeys.all, 'rincian'] as const,
  detail: (id: number | null) => [...barangKeys.details(), id] as const,
}

function decodeList(payload: unknown): ListResponse<BarangRow> { return v.parse(BarangListSchema, payload) }
function decodeId(payload: unknown): { id: number } { return v.parse(v.object({ id: v.number() }), payload) }
function decodeUpdate(payload: unknown): { row: BarangRow; hargaBeliTerakhir: number | null } { return v.parse(v.object({ row: BarangRowSchema, hargaBeliTerakhir: v.nullable(v.number()) }), payload) }

export function getBarang(params: BarangParams, admin = false) {
  const query = new URLSearchParams({ q: params.q, halaman: String(params.halaman) })
  if (admin) query.set('status', params.status ?? 'aktif')
  return apiFetch<ListResponse<BarangRow>>(`${admin ? '/api/admin/barang' : '/api/barang'}?${query}`, decodeList)
}

export function barangListOptions(params: BarangParams, admin = false) {
  return queryOptions({
    queryKey: barangKeys.list(params, admin),
    queryFn: () => getBarang(params, admin),
    placeholderData: keepPreviousData,
  })
}

export function tambahBarang(input: { nama: string; satuan: string; hargaJual: number }) {
  return apiFetch<{ id: number }>('/api/admin/barang', decodeId, { method: 'POST', body: JSON.stringify(input) })
}

export function ubahBarang(id: number, input: Record<string, unknown>) {
  return apiFetch<{ row: BarangRow; hargaBeliTerakhir: number | null }>(`/api/admin/barang/${id}`, decodeUpdate, { method: 'PATCH', body: JSON.stringify(input) })
}

export const tambahBarangMutationOptions = () => mutationOptions({
  mutationKey: [...barangKeys.all, 'mutasi', 'tambah'] as const,
  mutationFn: tambahBarang,
  meta: { errorHandledByForm: true },
  onSuccess: (_data, _variables, _result, { client }) => client.invalidateQueries({ queryKey: barangKeys.all }),
})

export const ubahBarangMutationOptions = () => mutationOptions({
  mutationKey: [...barangKeys.all, 'mutasi', 'ubah'] as const,
  mutationFn: ({ id, input }: { id: number; input: Record<string, unknown> }) => ubahBarang(id, input),
  meta: { errorHandledByForm: true },
  onSuccess: (_data, _variables, _result, { client }) => client.invalidateQueries({ queryKey: barangKeys.all }),
})
