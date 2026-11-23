export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function formatJumlah(value: number, unit?: string): string {
  const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: unit === 'kg' ? 1 : 0, maximumFractionDigits: unit === 'kg' ? 1 : 0 }).format(value)
  return unit ? `${formatted} ${unit}` : formatted
}

export function formatTanggal(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}
