import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import process from "node:process";

import { getPasswordStrength } from "../lib/password-strength";
import { db, client } from "./index";
import * as schema from "./schema";

async function seed() {
  const usernameValue = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!usernameValue || !password)
    throw new Error(
      "ADMIN_USERNAME dan ADMIN_PASSWORD wajib tersedia di environment.",
    );
  if (
    password.length < 8 ||
    getPasswordStrength(password, usernameValue) === "Lemah"
  ) {
    throw new Error(
      "Password admin harus minimal 8 karakter dan tidak berkekuatan Lemah.",
    );
  }

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.username, usernameValue),
  });
  if (existing) {
    if (existing.role !== "admin")
      throw new Error("Username admin sudah digunakan oleh akun non-admin.");
    console.info("Akun admin awal sudah tersedia; tidak ada perubahan.");
    return;
  }

  const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema.authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    plugins: [username()],
  });
  const emailPart =
    usernameValue.toLocaleLowerCase().replace(/[^a-z0-9._-]/g, "") || "admin";
  const created = await auth.api.signUpEmail({
    body: {
      name: usernameValue,
      email: `${emailPart}@kasiar.invalid`,
      password,
      username: usernameValue,
    },
  });
  if (!created) throw new Error("Akun admin tidak berhasil dibuat.");
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, created.user.id));
  console.info("Akun admin awal berhasil dibuat.");
}

seed()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed gagal.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
