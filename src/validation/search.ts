import * as v from 'valibot'
export function isInternalReturnTarget(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') && !Array.from(value).some((character) => { const code = character.charCodeAt(0); return code < 32 || code === 127 })
}
export const SearchSchema = v.object({
  kembali: v.optional(v.pipe(v.string(), v.check(isInternalReturnTarget, 'Alamat kembali tidak valid.'))),
  sesiBerakhir: v.optional(v.pipe(v.string(), v.check((value) => value === '1', 'Penanda sesi tidak valid.'))),
})
export const LoginSearchSchema = SearchSchema
export function safeReturnTarget(value: unknown): string {
  return typeof value === 'string' && isInternalReturnTarget(value) ? value : '/'
}
