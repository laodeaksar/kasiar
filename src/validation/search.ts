import * as v from 'valibot'

const INTERNAL_URL_BASE = 'https://kasiar.invalid'
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/

export function isInternalReturnTarget(value: string): boolean {
  if (!value.startsWith('/') || CONTROL_CHARACTERS.test(value)) return false

  try {
    // WHATWG URL treats backslashes like slashes for special schemes.
    // Comparing origins catches //host and slash/backslash variants consistently.
    return new URL(value, INTERNAL_URL_BASE).origin === INTERNAL_URL_BASE
  } catch {
    return false
  }
}

export const SearchSchema = v.object({
  kembali: v.optional(v.pipe(v.string(), v.check(isInternalReturnTarget, 'Alamat kembali tidak valid.'))),
  sesiBerakhir: v.optional(v.pipe(v.string(), v.check((value) => value === '1', 'Penanda sesi tidak valid.'))),
})
export const LoginSearchSchema = SearchSchema

export function parseLoginSearch(value: unknown): v.InferOutput<typeof LoginSearchSchema> {
  const result = v.safeParse(LoginSearchSchema, value)
  return result.success ? result.output : {}
}

export function safeReturnTarget(value: unknown): string {
  return typeof value === 'string' && isInternalReturnTarget(value) ? value : '/'
}
