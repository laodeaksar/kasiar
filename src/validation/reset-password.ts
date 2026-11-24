import * as v from 'valibot'
import { getPasswordStrength } from '../lib/password-strength'
export const ResetPasswordSchema = v.pipe(
  v.object({
    userId: v.pipe(v.string(), v.minLength(1, 'Akun kasir tidak valid.')),
    username: v.pipe(v.string(), v.minLength(1, 'Username tidak valid.')),
    password: v.pipe(v.string(), v.minLength(8, 'Password minimal 8 karakter.'), v.maxLength(128, 'Password maksimal 128 karakter.')),
  }),
  v.forward(v.check(({ username, password }) => getPasswordStrength(password, username) !== 'Lemah', 'Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol.'), ['password']),
)
export type ResetPasswordInput = v.InferInput<typeof ResetPasswordSchema>
