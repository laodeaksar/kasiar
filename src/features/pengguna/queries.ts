import * as v from 'valibot'
import { apiFetch } from '../../lib/api'
const KasirRowSchema = v.object({ id: v.string(), username: v.string(), createdAt: v.string() })
const kasirListSchema = v.array(KasirRowSchema)
const messageSchema = v.object({ message: v.string() })
export type KasirRow = v.InferOutput<typeof KasirRowSchema>
export const getKasir = () => apiFetch<KasirRow[]>('/api/admin/pengguna', (payload) => v.parse(kasirListSchema, payload))
export const buatKasir = (input: { username: string; password: string }) => apiFetch<{ message: string }>('/api/admin/pengguna', (payload) => v.parse(messageSchema, payload), { method: 'POST', body: JSON.stringify(input) })
export const resetPasswordKasir = (userId: string, input: { userId: string; username: string; password: string }) => apiFetch<{ message: string }>(`/api/admin/pengguna/${encodeURIComponent(userId)}/reset-password`, (payload) => v.parse(messageSchema, payload), { method: 'POST', body: JSON.stringify(input) })
