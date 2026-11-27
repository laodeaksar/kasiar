import { Hono } from "hono";

import { cariPembeli, simpanTransaksi, TransaksiError } from "../services/transaksi";

type Env = { Variables: { user: { id: string; role: string } } };

export const transaksiRoutes = new Hono<Env>();
transaksiRoutes.get("/pembeli", async (c) => c.json(await cariPembeli(c.req.query("q"))));
transaksiRoutes.post("/", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  try {
    return c.json(await simpanTransaksi(body, c.get("user").id), 201);
  } catch (error) {
    if (error instanceof TransaksiError)
      return c.json({ message: error.message, fields: error.fields }, error.status);
    throw error;
  }
});
