import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import * as v from "valibot";

import { db } from "~/db";
import { barang, itemTransaksi, pembeli, transaksi } from "~/db/schema";
import { TransaksiSchema } from "~/validation/transaksi";

export class TransaksiError extends Error {
  readonly fields: Record<string, string>;
  readonly status: 400 | 404 | 409;
  constructor(message: string, fields: Record<string, string> = {}, status: 400 | 404 | 409 = 400) {
    super(message);
    this.name = "TransaksiError";
    this.fields = fields;
    this.status = status;
  }
}
function fieldErrors(issues: readonly v.BaseIssue<unknown>[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path?.map((part) => String(part.key)).join(".") ?? "";
    if (key && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}
export async function cariPembeli(q: unknown) {
  const value = typeof q === "string" ? q.trim().slice(0, 100) : "";
  return db
    .select({ id: pembeli.id, nama: pembeli.nama })
    .from(pembeli)
    .where(value ? ilike(pembeli.nama, `%${value.replace(/[\\%_]/g, "\\$&")}%`) : undefined)
    .orderBy(pembeli.nama)
    .limit(20);
}
export async function simpanTransaksi(input: unknown, kasirId: string) {
  const parsed = v.safeParse(TransaksiSchema, input);
  if (!parsed.success)
    throw new TransaksiError(
      "Periksa kembali pembayaran dan keranjang.",
      fieldErrors(parsed.issues),
    );
  const value = parsed.output;
  const ids = value.items.map((item) => item.barangId);
  if (new Set(ids).size !== ids.length)
    throw new TransaksiError("Barang yang sama hanya boleh muncul sekali di keranjang.", {
      items: "Periksa keranjang.",
    });
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: barang.id,
        nama: barang.nama,
        satuan: barang.satuan,
        hargaJual: barang.hargaJual,
        stok: barang.stok,
        aktif: barang.aktif,
      })
      .from(barang)
      .where(inArray(barang.id, ids))
      .for("update");
    if (rows.length !== ids.length)
      throw new TransaksiError(
        "Ada barang yang tidak ditemukan.",
        { items: "Muat ulang daftar barang." },
        404,
      );
    let total = 0;
    const priced = value.items.map((item) => {
      const row = rows.find((entry) => entry.id === item.barangId)!;
      if (!row.aktif)
        throw new TransaksiError(`Barang “${row.nama}” sudah nonaktif.`, { items: row.nama }, 409);
      if (row.satuan !== "kg" && !Number.isInteger(item.jumlah))
        throw new TransaksiError(`Jumlah “${row.nama}” harus bilangan bulat.`, { items: row.nama });
      const quantity = Math.round(item.jumlah * 10);
      if (row.stok < quantity)
        throw new TransaksiError(
          `Stok tidak cukup untuk “${row.nama}”.`,
          { items: "Stok tidak cukup." },
          409,
        );
      const rawSubtotal = row.hargaJual * quantity;
      if (rawSubtotal % 10 !== 0)
        throw new TransaksiError(`Harga dan jumlah “${row.nama}” menghasilkan pecahan rupiah.`, {
          items: "Periksa jumlah.",
        });
      const subtotal = rawSubtotal / 10;
      total += subtotal;
      return { ...item, quantity, hargaSatuan: row.hargaJual, subtotal, row };
    });
    if (value.jumlahDibayar > total)
      throw new TransaksiError("Jumlah dibayar tidak boleh melebihi total.", {
        jumlahDibayar: "Jumlah dibayar melebihi total.",
      });
    const sisa = total - value.jumlahDibayar;
    const nama = value.pembeliNama?.trim() || null;
    if (sisa > 0 && !nama)
      throw new TransaksiError("Nama pembeli wajib diisi jika masih ada utang.", {
        pembeliNama: "Nama pembeli wajib diisi.",
      });
    let pembeliId: number | null = null;
    if (sisa > 0 && nama) {
      const existing = await tx
        .select({ id: pembeli.id })
        .from(pembeli)
        .where(eq(pembeli.nama, nama))
        .for("update")
        .limit(1);
      pembeliId =
        existing[0]?.id ??
        (await tx.insert(pembeli).values({ nama }).returning({ id: pembeli.id }))[0].id;
    }
    const [saved] = await tx
      .insert(transaksi)
      .values({
        total,
        jumlahDibayar: value.jumlahDibayar,
        status: sisa ? "utang" : "lunas",
        pembeliId,
        kasirId,
      })
      .returning({ id: transaksi.id });
    await tx.insert(itemTransaksi).values(
      priced.map((item) => ({
        transaksiId: saved.id,
        barangId: item.barangId,
        jumlahPersepuluh: item.quantity,
        hargaSatuan: item.hargaSatuan,
        subtotal: item.subtotal,
      })),
    );
    for (const item of priced)
      await tx
        .update(barang)
        .set({ stok: sql`${barang.stok} - ${item.quantity}` })
        .where(and(eq(barang.id, item.barangId), sql`${barang.stok} >= ${item.quantity}`));
    return {
      id: saved.id,
      status: sisa ? ("utang" as const) : ("lunas" as const),
      total,
      jumlahDibayar: value.jumlahDibayar,
      sisaUtang: sisa,
      namaPembeli: nama,
    };
  });
}
