import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  DataTable,
  DataTableSearch,
  DataTableStates,
  DataTableToolbar,
} from "~/components/data-table";
import { EmptyState, ErrorState, Skeleton } from "~/components/feedback";
import { PageHeader } from "~/components/page-header";
import { utangColumns } from "~/features/utang/columns";
import { PelunasanForm } from "~/features/utang/pelunasan-form";
import { utangDetailOptions, utangListOptions } from "~/features/utang/queries";
import { formatRupiah, formatTanggal } from "~/lib/format";
import { parseUtangSearch } from "~/validation/search";

export const Route = createFileRoute("/_app/utang")({
  validateSearch: (search) => parseUtangSearch(search),
  loaderDeps: ({ search }) => ({
    q: search.q,
    status: search.status,
    halaman: search.halaman,
    pembeli: search.pembeli,
  }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        utangListOptions({ q: deps.q, status: deps.status, halaman: deps.halaman }),
      ),
      deps.pembeli === undefined
        ? Promise.resolve()
        : context.queryClient.ensureQueryData(utangDetailOptions(deps.pembeli)),
    ]);
  },
  component: UtangPage,
});

function UtangPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const params = { q: search.q, status: search.status, halaman: search.halaman };
  const list = useQuery(utangListOptions(params));
  const detail = useQuery(utangDetailOptions(search.pembeli));
  const updateSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (old) => ({ ...old, ...patch }) });
  const clearSearch = () => updateSearch({ q: "", halaman: 1 });
  if (list.isError) return <ErrorState onRetry={() => void list.refetch()} />;
  if (list.isPending && !list.data)
    return (
      <Skeleton
        variant="table-rows"
        count={5}
      />
    );

  const data = list.data;
  const searchHasText = search.q.length > 0;
  return (
    <section className="space-y-7">
      <PageHeader
        title="Utang pembeli"
        description="Lihat sisa utang dan catat pembayaran pembeli."
      />
      <PelunasanForm onSaved={(id) => updateSearch({ pembeli: id })} />
      {search.pembeli !== undefined && (
        <section
          className="card border border-base-300 bg-base-100"
          aria-labelledby="utang-detail-title"
        >
          <div className="card-body gap-5">
            {detail.isError ? (
              <ErrorState onRetry={() => void detail.refetch()} />
            ) : detail.isPending && !detail.data ? (
              <Skeleton
                variant="cards"
                count={2}
              />
            ) : detail.data ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2
                      id="utang-detail-title"
                      className="card-title"
                    >
                      Rincian utang — {detail.data.nama}
                    </h2>
                    <p className="mt-1 text-sm">
                      Sisa utang: <strong>{formatRupiah(detail.data.sisaUtang)}</strong> · Status:{" "}
                      <strong>{detail.data.sisaUtang === 0 ? "Lunas" : "Belum lunas"}</strong>
                    </p>
                  </div>
                  <button
                    className="btn btn-outline min-h-11"
                    onClick={() => updateSearch({ pembeli: undefined })}
                  >
                    Tutup rincian
                  </button>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <section
                    className="space-y-3"
                    aria-labelledby="utang-transaksi-title"
                  >
                    <h3
                      id="utang-transaksi-title"
                      className="font-semibold"
                    >
                      Transaksi yang memiliki utang
                    </h3>
                    {detail.data.transaksi.length === 0 ? (
                      <EmptyState title="Tidak ada transaksi yang masih memiliki sisa." />
                    ) : (
                      <ul className="space-y-3">
                        {detail.data.transaksi.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-box border border-base-300 p-4 text-sm"
                          >
                            <p>
                              <strong>{formatTanggal(item.waktuDicatat)}</strong> · Dicatat oleh{" "}
                              {item.namaKasir}
                            </p>
                            <p className="mt-1">
                              Total transaksi: {formatRupiah(item.total)} · Dibayar saat transaksi:{" "}
                              {formatRupiah(item.jumlahDibayar)}
                            </p>
                            <p>
                              Sisa dari transaksi saat dicatat:{" "}
                              {formatRupiah(item.sisaSaatTransaksi)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section
                    className="space-y-3"
                    aria-labelledby="riwayat-pembayaran-title"
                  >
                    <h3
                      id="riwayat-pembayaran-title"
                      className="font-semibold"
                    >
                      Riwayat pembayaran
                    </h3>
                    {detail.data.pembayaran.length === 0 ? (
                      <EmptyState title="Belum ada pembayaran." />
                    ) : (
                      <ul className="space-y-3">
                        {detail.data.pembayaran.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap justify-between gap-2 rounded-box border border-base-300 p-4 text-sm"
                          >
                            <span>
                              {formatTanggal(item.tanggal)} · Dicatat oleh {item.namaPengguna}
                            </span>
                            <strong>{formatRupiah(item.nominal)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-base-content/70">
                      Pembayaran ditampilkan sebagai riwayat pembeli dan tidak dialokasikan ke
                      transaksi tertentu.
                    </p>
                  </section>
                </div>
              </>
            ) : null}
          </div>
        </section>
      )}
      <section
        className="space-y-4"
        aria-labelledby="daftar-utang-title"
      >
        <h2
          id="daftar-utang-title"
          className="text-xl font-semibold"
        >
          Daftar utang
        </h2>
        <DataTableToolbar>
          <DataTableSearch
            value={search.q}
            label="Cari nama pembeli"
            onChange={(q) => updateSearch({ q, halaman: 1 })}
          />
          <label className="form-control">
            <span className="label-text mb-1">Status</span>
            <select
              className="select select-bordered min-h-12"
              value={search.status}
              onChange={(event) =>
                updateSearch({ status: event.target.value as "belum-lunas" | "semua", halaman: 1 })
              }
            >
              <option value="belum-lunas">Belum lunas</option>
              <option value="semua">Semua</option>
            </select>
          </label>
        </DataTableToolbar>
        {data.rows.length > 0 && (
          <DataTable
            columns={utangColumns()}
            data={data}
            caption="Daftar utang pembeli"
            rowKey={(row) => String(row.id)}
            onPageChange={(halaman) => updateSearch({ halaman })}
          />
        )}
        {data.rows.length === 0 &&
          (searchHasText ? (
            <DataTableStates
              isEmpty
              isSearchEmpty
              query={search.q}
              onClearSearch={clearSearch}
            />
          ) : (
            <EmptyState
              title={
                search.status === "belum-lunas"
                  ? "Tidak ada utang yang belum lunas."
                  : "Belum ada catatan utang."
              }
            />
          ))}
      </section>
    </section>
  );
}
