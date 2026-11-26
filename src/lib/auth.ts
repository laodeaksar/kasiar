import process from 'node:process'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'
import { db } from '../db'
import * as schema from '../db/schema'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: 'pg', schema: schema.authSchema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    disableSignUp: true,
    requireEmailVerification: false,
  },
  plugins: [username()],
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'kasir', input: false },
    },
  },
})
export async function readUserSession(
  cookie: string,
): Promise<{ id: string; username: string; peran: 'admin' | 'kasir' } | null> {
  const result = await auth.api.getSession({ headers: new Headers({ cookie }) })
  const u = result?.user as
    | (typeof result extends null ? never : { id: string; username?: string; role?: string })
    | undefined
  if (!u) return null
  return { id: u.id, username: u.username ?? '', peran: u.role === 'admin' ? 'admin' : 'kasir' }
}
