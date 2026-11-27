import { and, asc, desc, eq, gt, ilike, sql } from "drizzle-orm";
import * as v from "valibot";

import { db } from "~/db";
import { pembayaranUtang, pembeli, transaksi, user } from "~/db/schema";
import { UKURAN_HALAMAN } from "~/lib/konstanta";
import { PelunasanSchema } from "~/validation/pelunasan";
import { parseUtangSearch } from "~/validation/search";

export class UtangError extends Error {
  readonly fields: Record<string, string>;
  readonly status: 400 | 404 | 409;

  constructor(
    message: string,
    fields: Record<string, string> = {},
    status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "UtangError";
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

function toSafeInteger(value: string | number) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount))
    throw new Error("Saldo utang tidak dapat dihitung dengan aman.");
  return amount;
}

function saldoPembeliSql() {
  return sql`coalesce((
    select sum(${transaksi.total}::bigint - ${transaksi.jumlahDibayar}::bigint)
    from ${transaksi}
    where ${transaksi.pembeliId} = ${pembeli.id} and ${transaksi.status} = 'utang'
  ), 0) - coalesce((
    select sum(${pembayaranUtang.nominal}::bigint)
    from ${pembayaranUtang}
    where ${pembayaranUtang.pembeliId} = ${pembeli.id}
  ), 0)`;
}

async function hitungSaldo(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  pembeliId: number,
) {
  const [row] = await tx
    .select({
      totalUtang: sql<string>`coalesce((
        select sum(${transaksi.total}::bigint - ${transaksi.jumlahDibayar}::bigint)
        from ${transaksi}
        where ${transaksi.pembeliId} = ${pembeliId} and ${transaksi.status} = 'utang'
      ), 0)::text`,
      totalPembayaran: sql<string>`coalesce((
        select sum(${pembayaranUtang.nominal}::bigint)
        from ${pembayaranUtang}
        where ${pembayaranUtang.pembeliId} = ${pembeliId}
      ), 0)::text`,
    })
    .from(pembeli)
    .where(eq(pembeli.id, pembeliId));
  const totalUtang = toSafeInteger(row.totalUtang);
  const totalPembayaran = toSafeInteger(row.totalPembayaran);
  return {
    totalUtang,
    totalPembayaran,
    sisaUtang: Math.max(0, totalUtang - totalPembayaran),
  };
}

export async function daftarUtang(search: unknown) {
  const params = parseUtangSearch(search);
  const filters = [
    sql`exists (
      select 1 from ${transaksi}
      where ${transaksi.pembeliId} = ${pembeli.id} and ${transaksi.status} = 'utang'
    )`,
  ];
  if (params.q)
    filters.push(
      ilike(pembeli.nama, `%${params.q.replace(/[\\%_]/g, "\\$&")}%`),
    );
  if (params.status === "belum-lunas") filters.push(gt(saldoPembeliSql(), 0));
  const where = and(...filters);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(pembeli)
    .where(where);
  const page = Math.min(
    params.halaman,
    Math.max(1, Math.ceil(total / UKURAN_HALAMAN)),
  );
  const rows = await db
    .select({
      id: pembeli.id,
      nama: pembeli.nama,
      sisaUtang: sql<string>`(${saldoPembeliSql()})::text`,
    })
    .from(pembeli)
    .where(where)
    .orderBy(asc(pembeli.nama), asc(pembeli.id))
    .limit(UKURAN_HALAMAN)
    .offset((page - 1) * UKURAN_HALAMAN);
  return {
    rows: rows.map((row) => {
      const sisaUtang = Math.max(0, toSafeInteger(row.sisaUtang));
      return {
        id: row.id,
        nama: row.nama,
        sisaUtang,
        status: sisaUtang > 0 ? "utang" : "lunas",
      };
    }),
    total,
    page,
    pageSize: UKURAN_HALAMAN,
  };
}

export async function rincianUtang(pembeliIdInput: unknown) {
  const parsedId = v.safeParse(
    v.pipe(
      v.union([v.number(), v.string()]),
      v.transform(Number),
      v.integer(),
      v.minValue(1),
    ),
    pembeliIdInput,
  );
  if (!parsedId.success)
    throw new UtangError("Pembeli tidak ditemukan.", {}, 404);
  const pembeliId = parsedId.output;
  const [buyer] = await db
    .select({ id: pembeli.id, nama: pembeli.nama })
    .from(pembeli)
    .where(eq(pembeli.id, pembeliId));
  if (!buyer) throw new UtangError("Pembeli tidak ditemukan.", {}, 404);

  const [summary] = await db
    .select({
      totalUtang: sql<string>`coalesce((
        select sum(${transaksi.total}::bigint - ${transaksi.jumlahDibayar}::bigint)
        from ${transaksi}
        where ${transaksi.pembeliId} = ${pembeliId} and ${transaksi.status} = 'utang'
      ), 0)::text`,
      totalPembayaran: sql<string>`coalesce((
        select sum(${pembayaranUtang.nominal}::bigint)
        from ${pembayaranUtang}
        where ${pembayaranUtang.pembeliId} = ${pembeliId}
      ), 0)::text`,
    })
    .from(pembeli)
    .where(eq(pembeli.id, pembeliId));
  const totalUtang = toSafeInteger(summary.totalUtang);
  const totalPembayaran = toSafeInteger(summary.totalPembayaran);
  const [transaksiUtang, riwayatPembayaran] = await Promise.all([
    db
      .select({
        id: transaksi.id,
        waktuDicatat: transaksi.waktuDicatat,
        total: transaksi.total,
        jumlahDibayar: transaksi.jumlahDibayar,
        sisaSaatTransaksi: sql<number>`${transaksi.total} - ${transaksi.jumlahDibayar}`,
        namaKasir: user.name,
      })
      .from(transaksi)
      .innerJoin(user, eq(transaksi.kasirId, user.id))
      .where(
        and(
          eq(transaksi.pembeliId, pembeliId),
          eq(transaksi.status, "utang"),
          gt(transaksi.total, transaksi.jumlahDibayar),
        ),
      )
      .orderBy(
        desc(transaksi.waktuDicatat),
        desc(transaksi.createdAt),
        desc(transaksi.id),
      ),
    db
      .select({
        id: pembayaranUtang.id,
        tanggal: pembayaranUtang.tanggal,
        nominal: pembayaranUtang.nominal,
        namaPengguna: user.name,
      })
      .from(pembayaranUtang)
      .innerJoin(user, eq(pembayaranUtang.penggunaId, user.id))
      .where(eq(pembayaranUtang.pembeliId, pembeliId))
      .orderBy(desc(pembayaranUtang.tanggal), desc(pembayaranUtang.id)),
  ]);
  return {
    ...buyer,
    totalUtang,
    totalPembayaran,
    sisaUtang: Math.max(0, totalUtang - totalPembayaran),
    transaksi: transaksiUtang,
    pembayaran: riwayatPembayaran,
  };
}

export async function catatPelunasan(input: unknown, penggunaId: string) {
  const parsed = v.safeParse(PelunasanSchema, input);
  if (!parsed.success)
    throw new UtangError(
      "Periksa kembali pembeli dan nominal pembayaran.",
      fieldErrors(parsed.issues),
    );
  const value = parsed.output;

  return db.transaction(async (tx) => {
    const [buyer] = await tx
      .select({ id: pembeli.id, nama: pembeli.nama })
      .from(pembeli)
      .where(eq(pembeli.id, value.pembeliId))
      .for("update");
    if (!buyer)
      throw new UtangError(
        "Pembeli tidak ditemukan.",
        { pembeliId: "Pilih pembeli." },
        404,
      );

    const balance = await hitungSaldo(tx, buyer.id);
    if (balance.sisaUtang <= 0)
      throw new UtangError(
        "Pembeli ini tidak memiliki sisa utang.",
        {
          nominal: "Tidak ada sisa utang untuk dibayar.",
        },
        409,
      );
    if (value.nominal > balance.sisaUtang)
      throw new UtangError(
        "Nominal pembayaran melebihi sisa utang.",
        {
          nominal: "Nominal tidak boleh melebihi sisa utang.",
        },
        409,
      );

    const [payment] = await tx
      .insert(pembayaranUtang)
      .values({
        pembeliId: buyer.id,
        nominal: value.nominal,
        penggunaId,
      })
      .returning({ id: pembayaranUtang.id });
    const sisaUtang = balance.sisaUtang - value.nominal;
    return {
      id: payment.id,
      pembeliId: buyer.id,
      nominal: value.nominal,
      sisaUtang,
      status: sisaUtang === 0 ? "lunas" : "utang",
    };
  });
}
