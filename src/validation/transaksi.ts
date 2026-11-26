import * as v from 'valibot'

const ItemSchema = v.object({
  barangId: v.pipe(v.number('Pilih barang.'), v.integer(), v.minValue(1)),
  jumlah: v.pipe(
    v.number('Jumlah wajib berupa angka.'),
    v.minValue(0.1, 'Jumlah harus lebih dari 0.'),
    v.check(
      (value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-8,
      'Jumlah maksimal satu angka di belakang koma.',
    ),
  ),
})

export const TransaksiSchema = v.pipe(
  v.object({
    items: v.pipe(v.array(ItemSchema), v.minLength(1, 'Pilih minimal satu barang.')),
    total: v.pipe(v.number(), v.integer(), v.minValue(0)),
    barangId: v.optional(v.number()),
    jumlah: v.optional(v.number()),
    jumlahDibayar: v.pipe(
      v.number('Jumlah dibayar wajib berupa angka.'),
      v.integer('Jumlah dibayar harus bilangan bulat rupiah.'),
      v.minValue(0, 'Jumlah dibayar tidak boleh negatif.'),
    ),
    pembeliNama: v.optional(
      v.pipe(v.string(), v.trim(), v.maxLength(160, 'Nama pembeli maksimal 160 karakter.')),
    ),
  }),
  v.forward(
    v.check(
      (value) => value.jumlahDibayar <= value.total,
      'Jumlah dibayar tidak boleh melebihi total.',
    ),
    ['jumlahDibayar'],
  ),
  v.forward(
    v.check(
      (value) => value.jumlahDibayar === value.total || Boolean(value.pembeliNama?.trim()),
      'Nama pembeli wajib diisi jika masih ada utang.',
    ),
    ['pembeliNama'],
  ),
)

export const TambahKeranjangSchema = v.object({
  barangId: v.pipe(
    v.number('Pilih barang.'),
    v.integer(),
    v.minValue(1, 'Pilih barang yang tersedia.'),
  ),
  jumlah: ItemSchema.entries.jumlah,
})
export type TransaksiInput = v.InferInput<typeof TransaksiSchema>
