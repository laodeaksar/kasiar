export const SATUAN_BARANG = ["kg", "pcs", "pack", "karung", "butir", "rak"] as const;
export type SatuanBarang = (typeof SATUAN_BARANG)[number];
export const PERAN_PENGGUNA = ["admin", "kasir"] as const;
export type PeranPengguna = (typeof PERAN_PENGGUNA)[number];
export const STATUS_BARANG = ["aktif", "nonaktif", "semua"] as const;
export type StatusBarang = (typeof STATUS_BARANG)[number];
export const UKURAN_HALAMAN = 20;
export const STATUS_BARANG_BAWAAN = "aktif" satisfies StatusBarang;
