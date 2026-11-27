import * as v from "valibot";

import type { StatusBarang } from "~/lib/konstanta";

import { SATUAN_BARANG, STATUS_BARANG, STATUS_BARANG_BAWAAN } from "~/lib/konstanta";

export const BarangSchema = v.object({
  nama: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Nama barang wajib diisi."),
    v.maxLength(160, "Nama barang maksimal 160 karakter."),
  ),
  satuan: v.pipe(
    v.string(),
    v.check((value) => SATUAN_BARANG.some((unit) => unit === value), "Pilih satuan yang tersedia."),
  ),
  hargaJual: v.pipe(
    v.number("Harga jual wajib berupa angka."),
    v.integer("Harga jual harus berupa bilangan bulat rupiah."),
    v.minValue(0, "Harga jual tidak boleh negatif."),
  ),
});
export const BarangUbahSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  nama: v.optional(BarangSchema.entries.nama),
  satuan: v.optional(BarangSchema.entries.satuan),
  hargaJual: v.optional(BarangSchema.entries.hargaJual),
  aktif: v.optional(v.boolean()),
});
export type BarangInput = v.InferInput<typeof BarangSchema>;
export type BarangUbahInput = v.InferInput<typeof BarangUbahSchema>;
const QuerySchema = v.pipe(v.string(), v.maxLength(100));
const PageSchema = v.pipe(
  v.union([v.number(), v.string()]),
  v.transform((value) => (typeof value === "number" ? value : Number(value))),
  v.integer("Nomor halaman harus bilangan bulat."),
  v.minValue(1, "Nomor halaman minimal 1."),
);
const StatusSchema = v.picklist(STATUS_BARANG);
export const BarangSearchSchema = v.object({
  q: v.optional(QuerySchema),
  halaman: v.optional(PageSchema),
  status: v.optional(StatusSchema),
});
export const BarangListSearchSchema = v.object({
  q: v.optional(QuerySchema),
  halaman: v.optional(PageSchema),
});
function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
function parseQuery(value: unknown): string {
  const result = v.safeParse(QuerySchema, value);
  return result.success ? result.output : "";
}
function parsePage(value: unknown): number {
  const result = v.safeParse(PageSchema, value);
  return result.success ? result.output : 1;
}
export function parseBarangSearch(value: unknown) {
  const input = record(value);
  const result = v.safeParse(StatusSchema, input.status);
  const status: StatusBarang = result.success ? result.output : STATUS_BARANG_BAWAAN;
  return { q: parseQuery(input.q), halaman: parsePage(input.halaman), status };
}
export function parseBarangListSearch(value: unknown) {
  const input = record(value);
  return { q: parseQuery(input.q), halaman: parsePage(input.halaman) };
}
