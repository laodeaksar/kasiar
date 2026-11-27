import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    username: text("username").notNull().unique(),
    displayUsername: text("display_username"),
    role: varchar("role", { length: 16 }).notNull().default("kasir"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("user_role_check", sql`${table.role} in ('admin', 'kasir')`)],
);
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const barang = pgTable(
  "barang",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    nama: varchar("nama", { length: 160 }).notNull(),
    satuan: varchar("satuan", { length: 16 }).notNull(),
    hargaJual: integer("harga_jual").notNull(),
    stok: integer("stok").notNull().default(0),
    aktif: boolean("aktif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("barang_harga_nonnegatif", sql`${t.hargaJual} >= 0`),
    check("barang_stok_nonnegatif", sql`${t.stok} >= 0`),
  ],
);
export const pembeli = pgTable("pembeli", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  nama: varchar("nama", { length: 160 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const barangMasuk = pgTable(
  "barang_masuk",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tanggal: date("tanggal").notNull(),
    waktuDicatat: timestamp("waktu_dicatat", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    barangId: integer("barang_id")
      .notNull()
      .references(() => barang.id),
    jumlahPersepuluh: integer("jumlah_persepuluh").notNull(),
    hargaBeli: integer("harga_beli").notNull(),
    pemasok: varchar("pemasok", { length: 200 }),
    penggunaId: text("pengguna_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
    check("barang_masuk_jumlah_positif", sql`${t.jumlahPersepuluh} > 0`),
    check("barang_masuk_harga_nonnegatif", sql`${t.hargaBeli} >= 0`),
  ],
);
export const transaksi = pgTable(
  "transaksi",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    waktuDicatat: timestamp("waktu_dicatat", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    total: integer("total").notNull(),
    jumlahDibayar: integer("jumlah_dibayar").notNull(),
    status: varchar("status", { length: 12 }).notNull(),
    pembeliId: integer("pembeli_id").references(() => pembeli.id),
    kasirId: text("kasir_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
    check("transaksi_total_nonnegatif", sql`${t.total} >= 0`),
    check(
      "transaksi_dibayar_valid",
      sql`${t.jumlahDibayar} >= 0 and ${t.jumlahDibayar} <= ${t.total}`,
    ),
    check("transaksi_status_valid", sql`${t.status} in ('lunas', 'utang')`),
    check(
      "transaksi_pembeli_jika_utang",
      sql`${t.jumlahDibayar} = ${t.total} or ${t.pembeliId} is not null`,
    ),
  ],
);
export const itemTransaksi = pgTable(
  "item_transaksi",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transaksiId: uuid("transaksi_id")
      .notNull()
      .references(() => transaksi.id),
    barangId: integer("barang_id")
      .notNull()
      .references(() => barang.id),
    jumlahPersepuluh: integer("jumlah_persepuluh").notNull(),
    hargaSatuan: integer("harga_satuan").notNull(),
    subtotal: integer("subtotal").notNull(),
  },
  (t) => [
    check("item_jumlah_positif", sql`${t.jumlahPersepuluh} > 0`),
    check("item_harga_nonnegatif", sql`${t.hargaSatuan} >= 0`),
    check("item_subtotal_nonnegatif", sql`${t.subtotal} >= 0`),
  ],
);
export const riwayatHargaJual = pgTable(
  "riwayat_harga_jual",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    barangId: integer("barang_id")
      .notNull()
      .references(() => barang.id),
    hargaJual: integer("harga_jual").notNull(),
    berlakuSejak: timestamp("berlaku_sejak", { withTimezone: true }).notNull().defaultNow(),
    adminId: text("admin_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [check("riwayat_harga_nonnegatif", sql`${t.hargaJual} >= 0`)],
);
export const pembayaranUtang = pgTable(
  "pembayaran_utang",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    pembeliId: integer("pembeli_id")
      .notNull()
      .references(() => pembeli.id),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull().defaultNow(),
    nominal: integer("nominal").notNull(),
    penggunaId: text("pengguna_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("pembayaran_nominal_positif", sql`${t.nominal} > 0`)],
);
export const authSchema = { user, session, account, verification };
