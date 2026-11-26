import * as v from 'valibot'
export const LoginSchema = v.object({
  username: v.pipe(v.string(), v.minLength(1, 'Username wajib diisi.')),
  password: v.pipe(v.string(), v.minLength(1, 'Password wajib diisi.')),
})
export type LoginInput = v.InferInput<typeof LoginSchema>
