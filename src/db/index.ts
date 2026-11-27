import { drizzle } from "drizzle-orm/postgres-js";
import process from "node:process";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.NODE_ENV !== "test") throw new Error("DATABASE_URL belum diatur.");
const client = postgres(databaseUrl ?? "postgres://localhost/kasiar", { prepare: false, max: 1 });
export const db = drizzle(client, { schema });
export { client };
