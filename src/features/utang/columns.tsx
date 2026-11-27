import { Link } from "@tanstack/react-router";

import {
  RupiahCell,
  StatusBadge,
  columnHelperFor,
} from "~/components/data-table";

import type { UtangRow } from "./queries";

const col = columnHelperFor<UtangRow>();

export function utangColumns() {
  return col.columns([
    {
      accessorKey: "nama",
      header: "Pembeli",
      cell: (info) => {
        const row = info.row.original;
        return (
          <Link
            className="link link-primary font-medium"
            to="/utang"
            search={(old) => ({
              q: old.q ?? "",
              status: old.status === "semua" ? "semua" : "belum-lunas",
              halaman: old.halaman ?? 1,
              pembeli: row.id,
            })}
          >
            {row.nama}
          </Link>
        );
      },
      meta: { mobilePriority: "judul" },
    },
    {
      accessorKey: "sisaUtang",
      header: "Sisa utang",
      cell: (info) => <RupiahCell value={info.getValue<number>()} />,
      meta: { mobilePriority: "detail" },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue<string>()} />,
      meta: { mobilePriority: "detail" },
    },
  ]);
}
