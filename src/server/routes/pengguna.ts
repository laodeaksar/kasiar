import { Hono } from 'hono'
import { hashPassword } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { account, session, user } from '../../db/schema'
import { getPasswordAssessment } from '../../lib/password-strength'
import { PenggunaSchema } from '../../validation/pengguna'
import { ResetPasswordSchema } from '../../validation/reset-password'
import * as v from 'valibot'
type Env = { Variables: { user: { id: string; role: string } } }
export const penggunaRoutes = new Hono<Env>()
function fieldErrors(issues: readonly v.BaseIssue<unknown>[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path?.map((part: { key: unknown }) => String(part.key)).join('.') ?? ''
    if (key && !fields[key]) fields[key] = issue.message
  }
  return fields
}
const weakPasswordMessage = 'Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol.'
penggunaRoutes.get('/', async (c) => {
  const rows = await db
    .select({ id: user.id, username: user.username, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.role, 'kasir'))
    .orderBy(user.username)
  return c.json(rows)
})
penggunaRoutes.post('/', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  const result = v.safeParse(PenggunaSchema, body)
  if (!result.success)
    return c.json(
      { message: 'Periksa kembali username dan password.', fields: fieldErrors(result.issues) },
      400,
    )
  const { username: usernameValue, password } = result.output
  if (!getPasswordAssessment(password, usernameValue).valid)
    return c.json({ message: weakPasswordMessage, fields: { password: weakPasswordMessage } }, 400)
  const email = `${usernameValue.toLocaleLowerCase()}@kasiar.invalid`
  try {
    const accountId = crypto.randomUUID()
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(user)
        .values({
          id: accountId,
          name: usernameValue,
          username: usernameValue,
          displayUsername: usernameValue,
          email,
          emailVerified: true,
          role: 'kasir',
        })
        .returning({ id: user.id })
      await tx.insert(account).values({
        id: crypto.randomUUID(),
        accountId: created.id,
        providerId: 'credential',
        userId: created.id,
        password: await hashPassword(password),
      })
    })
  } catch {
    return c.json(
      { message: 'Username sudah digunakan.', fields: { username: 'Username sudah digunakan.' } },
      409,
    )
  }
  return c.json({ message: 'Akun kasir dibuat.' }, 201)
})
penggunaRoutes.post('/:id/reset-password', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  const result = v.safeParse(ResetPasswordSchema, body)
  if (!result.success)
    return c.json(
      { message: 'Periksa kembali password baru.', fields: fieldErrors(result.issues) },
      400,
    )
  const { userId, username: usernameValue, password } = result.output
  if (!getPasswordAssessment(password, usernameValue).valid)
    return c.json({ message: weakPasswordMessage, fields: { password: weakPasswordMessage } }, 400)
  if (userId !== c.req.param('id'))
    return c.json(
      { message: 'Akun kasir tidak valid.', fields: { userId: 'Akun kasir tidak valid.' } },
      400,
    )
  const [target] = await db
    .select({ id: user.id, username: user.username })
    .from(user)
    .where(and(eq(user.id, userId), eq(user.role, 'kasir')))
    .limit(1)
  if (!target || target.username !== usernameValue)
    return c.json({ message: 'Akun kasir tidak ditemukan.', fields: {} }, 404)
  const passwordHash = await hashPassword(password)
  await db.transaction(async (tx) => {
    await tx
      .update(account)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    await tx.delete(session).where(eq(session.userId, userId))
  })
  return c.json({ message: 'Password kasir direset.' })
})
