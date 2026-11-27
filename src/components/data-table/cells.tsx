import { formatJumlah, formatRupiah, formatTanggal } from "~/lib/format";

export const RupiahCell = ({ value }: { value: number }) => (
  <span className="whitespace-nowrap">{formatRupiah(value)}</span>
);

export const JumlahCell = ({
  value,
  unit,
}: {
  value: number;
  unit?: string;
}) => <span>{formatJumlah(value, unit)}</span>;

export const TanggalCell = ({ value }: { value: string | Date }) => (
  <time dateTime={value instanceof Date ? value.toISOString() : value}>
    {formatTanggal(value)}
  </time>
);

export function StatusBadge({ status }: { status: string }) {
  const known: Record<string, string> = {
    lunas: "Lunas",
    utang: "Utang",
    aktif: "Aktif",
    nonaktif: "Nonaktif",
  };

  return (
    <span className="badge badge-soft badge-sm">
      {known[status.toLocaleLowerCase()] ?? status}
    </span>
  );
}

export function AksiMenu({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
