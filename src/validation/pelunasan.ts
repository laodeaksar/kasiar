import * as v from 'valibot'

export const PelunasanSchema = v.object({
  pembeliNama: v.pipe(
    v.string('Pilih pembeli yang memiliki utang.'),
    v.minLength(1, 'Pilih pembeli yang memiliki utang.'),
  ),
  pembeliId: v.pipe(
    v.number('Pilih pembeli yang memiliki utang.'),
    v.integer('Pilih pembeli yang tersedia.'),
    v.minValue(1, 'Pilih pembeli yang memiliki utang.'),
  ),
  nominal: v.pipe(
    v.number('Nominal pembayaran wajib diisi.'),
    v.integer('Nominal harus bilangan bulat rupiah.'),
    v.minValue(1, 'Nominal pembayaran harus lebih dari Rp 0.'),
    v.maxValue(2147483647, 'Nominal pembayaran terlalu besar.'),
  ),
})

export type PelunasanInput = v.InferInput<typeof PelunasanSchema>
