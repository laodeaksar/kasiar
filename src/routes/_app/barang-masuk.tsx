import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { DataTable, DataTablePagination, DataTableSearch, DataTableStates, DataTableToolbar } from '../../components/data-table'
import { EmptyState, ErrorState, Skeleton } from '../../components/feedback'
import { PageHeader } from '../../components/page-header'
import { BarangMasukForm } from '../../features/barang-masuk/barang-masuk-form'
import { barangMasukColumns } from '../../features/barang-masuk/columns'
import { barangMasukListOptions } from '../../features/barang-masuk/queries'
import { parseBarangMasukSearch } from '../../validation/search'

export const Route = createFileRoute('/_app/barang-masuk')({
  validateSearch: (search) => parseBarangMasukSearch(search),
  loaderDeps: ({ search }) => ({ q: search.q, dari: search.dari, sampai: search.sampai, halaman: search.halaman }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(barangMasukListOptions(deps)),
  component: BarangMasukPage,
})

function BarangMasukPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isPending, isError, refetch } = useQuery(barangMasukListOptions(search))
  const changeSearch = (patch: Partial<typeof search>) => navigate({ search: (old) => ({ ...old, ...patch }) })
  if (isError) return <ErrorState onRetry={() => { void refetch() }}/>
  if (isPending && !data) return <Skeleton variant="table-rows" count={5}/>
  const empty = data.rows.length === 0
  const filtering = Boolean(search.q || search.dari || search.sampai)
  const clearFilters = () => changeSearch({ q: '', dari: '', sampai: '', halaman: 1 })

  return <section className="space-y-7">
    <PageHeader title="Barang masuk" description="Catat barang yang diterima agar stok bertambah dengan benar."/>
    <BarangMasukForm/>
    <section className="space-y-4" aria-labelledby="riwayat-barang-masuk">
      <h2 id="riwayat-barang-masuk" className="text-xl font-semibold">Riwayat barang masuk</h2>
      <DataTableToolbar>
        <DataTableSearch value={search.q} onChange={(q) => changeSearch({ q, halaman: 1 })} label="Cari barang atau pemasok"/>
        <label className="form-control"><span className="label-text mb-1">Dari tanggal</span><input type="date" className="input input-bordered min-h-12" value={search.dari} max={search.sampai || undefined} onChange={(event) => changeSearch({ dari: event.target.value, halaman: 1 })}/></label>
        <label className="form-control"><span className="label-text mb-1">Sampai tanggal</span><input type="date" className="input input-bordered min-h-12" value={search.sampai} min={search.dari || undefined} onChange={(event) => changeSearch({ sampai: event.target.value, halaman: 1 })}/></label>
        {filtering && <button className="btn btn-outline min-h-12" onClick={clearFilters}>Hapus filter</button>}
      </DataTableToolbar>
      {!empty && <DataTable columns={barangMasukColumns()} data={data} caption="Daftar barang masuk" rowKey={(row) => row.id}/>}
      {empty && filtering && <DataTableStates isEmpty isSearchEmpty query={search.q || `${search.dari || 'awal'} – ${search.sampai || 'akhir'}`} onClearSearch={clearFilters}/>}
      {empty && !filtering && <EmptyState title="Belum ada barang masuk. Catat barang masuk pertama." action={<a href="#form-barang-masuk" className="btn btn-primary">Catat barang masuk</a>}/>}
      {!empty && <DataTablePagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={(halaman) => changeSearch({ halaman })}/>}
    </section>
  </section>
}
