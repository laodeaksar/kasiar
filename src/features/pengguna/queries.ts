import { mutationOptions, queryOptions } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '../../lib/api'

const KasirRowSchema = v.object({ id: v.string(), username: v.string(), createdAt: v.string() })
const kasirListSchema = v.array(KasirRowSchema)
const messageSchema = v.object({ message: v.string() })
export type KasirRow = v.InferOutput<typeof KasirRowSchema>
export type PenggunaFormInput = { username: string; password: string }
export type ResetPasswordMutationInput = { userId: string; username: string; password: string }

export const penggunaKeys = {
  all: ['pengguna'] as const,
  lists: () => [...penggunaKeys.all, 'daftar'] as const,
  list: () => [...penggunaKeys.lists(), {}] as const,
  details: () => [...penggunaKeys.all, 'rincian'] as const,
  detail: (id: string | null) => [...penggunaKeys.details(), id] as const,
}

export const getKasir = () =>
  apiFetch<KasirRow[]>('/api/admin/pengguna', (payload) => v.parse(kasirListSchema, payload))
export const kasirListOptions = () =>
  queryOptions({ queryKey: penggunaKeys.list(), queryFn: getKasir })

export const buatKasir = (input: PenggunaFormInput) =>
  apiFetch<{ message: string }>(
    '/api/admin/pengguna',
    (payload) => v.parse(messageSchema, payload),
    { method: 'POST', body: JSON.stringify(input) },
  )
export const buatKasirMutationOptions = () =>
  mutationOptions({
    mutationKey: [...penggunaKeys.all, 'mutasi', 'buat'] as const,
    mutationFn: buatKasir,
    meta: { errorHandledByForm: true },
    onSuccess: (_data, _variables, _result, { client }) =>
      client.invalidateQueries({ queryKey: penggunaKeys.all }),
  })

export const resetPasswordKasir = (userId: string, input: ResetPasswordMutationInput) =>
  apiFetch<{ message: string }>(
    `/api/admin/pengguna/${encodeURIComponent(userId)}/reset-password`,
    (payload) => v.parse(messageSchema, payload),
    { method: 'POST', body: JSON.stringify(input) },
  )
export const resetPasswordMutationOptions = () =>
  mutationOptions({
    mutationKey: [...penggunaKeys.all, 'mutasi', 'reset-password'] as const,
    mutationFn: (input: ResetPasswordMutationInput) => resetPasswordKasir(input.userId, input),
    meta: { errorHandledByForm: true },
    onSuccess: (_data, _variables, _result, { client }) =>
      client.invalidateQueries({ queryKey: penggunaKeys.all }),
  })
