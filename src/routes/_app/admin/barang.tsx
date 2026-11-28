import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { useConfirm } from "~/components/confirm";
import {
  DataTable,
  DataTableSearch,
  DataTableStates,
  DataTableToolbar,
} from "~/components/data-table";
import { EmptyState, ErrorState, Skeleton } from "~/components/feedback";
import { HeaderButton, PageHeader } from "~/components/page-header";
import { toast } from "~/components/toast";
import { BarangForm } from "~/features/barang/barang-form";
import { barangColumns } from "~/features/barang/columns";
import {
  barangListOptions,
  ubahBarangMutationOptions,
  type BarangRow,
} from "~/features/barang/queries";
import { parseBarangSearch } from "~/validation/barang";

export const Route = createFileRoute("/_app/admin/barang")({
  validateSearch: (search) => parseBarangSearch(search),
  beforeLoad: ({ context }) => {
    if (context.session?.peran !== "admin") throw redirect({ to: "/" });
  },
  loaderDeps: ({ search }) => ({
    q: search.q,
    halaman: search.halaman,
    status: search.status,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(barangListOptions(deps, true)),
  component: AdminBarangPage,
});

function AdminBarangPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const isAdmin = Route.useRouteContext().session?.peran === "admin";
  const { data, isPending, isError, refetch } = useQuery(
    barangListOptions(search, true),
  );
  const [modal, setModal] = useState<{
    open: boolean;
    barang: BarangRow | null;
  }>({
    open: false,
    barang: null,
  });
  const confirm = useConfirm();
  const toggleMutation = useMutation(ubahBarangMutationOptions());
  const changeSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (old) => ({ ...old, ...patch }) });

  async function toggleActive(row: BarangRow) {
    if (
      row.aktif &&
      !(await confirm({
        title: "Yakin?",
        message: `Nonaktifkan barang “${row.nama}”? Barang nonaktif tidak ditampilkan pada daftar barang.`,
        confirmText: "Nonaktifkan",
        danger: true,
      }))
    )
      return;
    try {
      await toggleMutation.mutateAsync({
        id: row.id,
        input: { aktif: !row.aktif },
      });
      toast.success("Data barang diperbarui.");
    } catch {
      toast.error("Perubahan barang tidak berhasil. Coba lagi.");
    }
  }

  if (isError)
    return (
      <ErrorState
        onRetry={() => {
          void refetch();
        }}
      />
    );
  if (isPending && !data)
    return (
      <Skeleton
        variant="table-rows"
        count={5}
      />
    );

  const columns = barangColumns(true, (row) => (
    <button
      className="btn btn-sm btn-outline"
      onClick={() =>
        row.aktif
          ? setModal({ open: true, barang: row })
          : void toggleActive(row)
      }
    >
      {row.aktif ? "Ubah" : "Aktifkan"}
    </button>
  ));
  const empty = data.rows.length === 0;
  const searching = Boolean(search.q) && empty;

  return (
    <section className="space-y-5">
      <PageHeader
        title="Kelola Barang"
        description="Tambah barang dan atur nama, satuan, harga jual, serta statusnya."
        actions={
          isAdmin ? (
            <HeaderButton
              icon={Plus}
              label="Tambah barang"
              variant="utama"
              onClick={() => setModal({ open: true, barang: null })}
            />
          ) : undefined
        }
      />

      <DataTableToolbar>
        <DataTableSearch
          value={search.q}
          onChange={(q) => changeSearch({ q, halaman: 1 })}
        />
        <label className="form-control w-full max-w-xs">
          <span className="label-text mb-1">Status barang</span>
          <select
            className="select select-bordered"
            value={search.status}
            onChange={(event) =>
              changeSearch({
                status: event.target.value as typeof search.status,
                halaman: 1,
              })
            }
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
            <option value="semua">Semua</option>
          </select>
        </label>
      </DataTableToolbar>

      {!empty && (
        <DataTable
          columns={columns}
          data={data}
          caption="Daftar barang untuk admin"
          rowKey={(row) => String(row.id)}
          onPageChange={(halaman) => changeSearch({ halaman })}
        />
      )}
      {empty && searching && (
        <DataTableStates
          isEmpty
          isSearchEmpty
          query={search.q}
          onClearSearch={() => changeSearch({ q: "", halaman: 1 })}
        />
      )}
      {empty && !searching && (
        <EmptyState
          title="Belum ada barang. Tambahkan barang pertama."
          action={
            <button
              className="btn btn-primary"
              onClick={() => setModal({ open: true, barang: null })}
            >
              Tambah barang
            </button>
          }
        />
      )}

      {modal.open && (
        <BarangForm
          key={modal.barang?.id ?? "new"}
          row={modal.barang}
          onClose={() => setModal({ open: false, barang: null })}
          onSaved={() => setModal({ open: false, barang: null })}
        />
      )}
    </section>
  );
}
