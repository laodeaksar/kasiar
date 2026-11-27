import * as v from "valibot";

function isRealDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isJumlahValidUntukSatuan(jumlah: number, satuan: string): boolean {
  return satuan === "kg" || Number.isInteger(jumlah);
}

export const BarangMasukSchema = v.object({
  tanggal: v.pipe(
    v.string("Tanggal wajib diisi."),
    v.regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus memakai format YYYY-MM-DD."),
    v.check(isRealDate, "Tanggal tidak valid."),
  ),
  barangId: v.pipe(
    v.number("Pilih barang yang akan dicatat."),
    v.integer("Pilih barang yang tersedia."),
    v.minValue(1, "Pilih barang yang tersedia."),
  ),
  jumlah: v.pipe(
    v.number("Jumlah wajib berupa angka."),
    v.minValue(0.1, "Jumlah harus lebih dari 0."),
    v.maxValue(214748364.7, "Jumlah terlalu besar."),
    v.check(
      (value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-8,
      "Jumlah maksimal satu angka di belakang koma.",
    ),
  ),
  hargaBeli: v.pipe(
    v.number("Harga beli wajib berupa angka."),
    v.integer("Harga beli harus berupa bilangan bulat rupiah."),
    v.minValue(0, "Harga beli tidak boleh negatif."),
    v.maxValue(2147483647, "Harga beli terlalu besar."),
  ),
  pemasok: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(200, "Nama pemasok maksimal 200 karakter.")),
  ),
});

export type BarangMasukInput = v.InferInput<typeof BarangMasukSchema>;
