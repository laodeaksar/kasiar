// Contoh acuan: query dan mutasi berada di sini, bukan di komponen atau loader. Param daftar harus sudah divalidasi.
import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '../../lib/api'
import type { ContohMutationInput } from '../../validation/contoh-mutation'
import type { ContohQuerySearch } from '../../validation/contoh-query'

const HealthSchema = v.object({ status: v.picklist(['ok']) })
export type HealthStatus = v.InferOutput<typeof HealthSchema>
export type { ContohMutationInput as ContohMutasiInput }
export type ContohMutasiHasil = { message: string }
type ContohPengirim = (input: ContohMutationInput) => Promise<ContohMutasiHasil>

export const contohKeys = {
  all: ['contoh'] as const,
  lists: () => [...contohKeys.all, 'daftar'] as const,
  list: (params: ContohQuerySearch) => [...contohKeys.lists(), params] as const,
  details: () => [...contohKeys.all, 'rincian'] as const,
  detail: (id: string | null) => [...contohKeys.details(), id] as const,
  health: () => [...contohKeys.details(), 'health'] as const,
}

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: contohKeys.health(),
    queryFn: () =>
      apiFetch<HealthStatus>('/api/health', (payload) => v.parse(HealthSchema, payload)),
  })

// Pola daftar untuk dipakai fitur berparameter: parameter tervalidasi menjadi bagian key dan data lama tetap terlihat saat memuat halaman berikutnya.
export function contohListQueryOptions<T>(
  params: ContohQuerySearch,
  queryFn: (params: ContohQuerySearch) => Promise<T>,
) {
  return queryOptions({
    queryKey: contohKeys.list(params),
    queryFn: () => queryFn(params),
    placeholderData: keepPreviousData,
  })
}

// Pola rincian bersyarat: query tidak berjalan sampai id yang tervalidasi tersedia.
export function contohDetailQueryOptions<T>(
  id: string | null,
  queryFn: (id: string) => Promise<T>,
) {
  return queryOptions({
    queryKey: contohKeys.detail(id),
    queryFn: () => queryFn(id as string),
    enabled: Boolean(id),
  })
}

export function contohMutasiOptions(send: ContohPengirim) {
  return mutationOptions({
    mutationKey: [...contohKeys.all, 'mutasi', 'uji-form'] as const,
    mutationFn: send,
    meta: { errorHandledByForm: true },
    onSuccess: (_data, _variables, _result, { client }) =>
      client.invalidateQueries({ queryKey: contohKeys.all }),
  })
}
