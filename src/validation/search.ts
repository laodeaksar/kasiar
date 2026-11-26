import * as v from 'valibot'

const INTERNAL_URL_BASE = 'https://kasiar.invalid'
// oxlint-disable-next-line no-control-regex -- Karakter kontrol sengaja ditolak pada alamat kembali.
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
  kembali: v.optional(
    v.pipe(v.string(), v.check(isInternalReturnTarget, 'Alamat kembali tidak valid.')),
  ),
  sesiBerakhir: v.optional(
    v.pipe(
      v.string(),
      v.check((value) => value === '1', 'Penanda sesi tidak valid.'),
    ),
  ),
})
export const LoginSearchSchema = SearchSchema

export function parseLoginSearch(value: unknown): v.InferOutput<typeof LoginSearchSchema> {
  const result = v.safeParse(LoginSearchSchema, value)
  return result.success ? result.output : {}
}

export function safeReturnTarget(value: unknown): string {
  return typeof value === 'string' && isInternalReturnTarget(value) ? value : '/'
}

function isValidDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const BarangMasukPageSchema = v.pipe(
  v.union([v.number(), v.string()]),
  v.transform((value) => (typeof value === 'number' ? value : Number(value))),
  v.integer(),
  v.minValue(1),
)
export const BarangMasukSearchSchema = v.object({
  q: v.optional(v.pipe(v.string(), v.maxLength(100))),
  dari: v.optional(
    v.pipe(
      v.string(),
      v.check((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && isValidDate(value)),
    ),
  ),
  sampai: v.optional(
    v.pipe(
      v.string(),
      v.check((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && isValidDate(value)),
    ),
  ),
  halaman: v.optional(BarangMasukPageSchema),
})

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

export function parseBarangMasukSearch(value: unknown) {
  const input = asRecord(value)
  const q = v.safeParse(v.pipe(v.string(), v.maxLength(100)), input.q ?? '')
  const halaman = v.safeParse(BarangMasukPageSchema, input.halaman ?? 1)
  const dari = v.safeParse(BarangMasukSearchSchema.entries.dari, input.dari)
  const sampai = v.safeParse(BarangMasukSearchSchema.entries.sampai, input.sampai)
  const safeQ = q.success ? q.output : ''
  const safePage = halaman.success ? halaman.output : 1
  const safeFrom = dari.success ? (dari.output ?? '') : ''
  const safeTo = sampai.success ? (sampai.output ?? '') : ''
  if (safeFrom && safeTo && safeFrom > safeTo) return { q: safeQ, dari: '', sampai: '', halaman: 1 }
  return { q: safeQ, dari: safeFrom, sampai: safeTo, halaman: safePage }
}
