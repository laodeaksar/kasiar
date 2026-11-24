import { createFileRoute } from '@tanstack/react-router'
import { DataTable, DataTablePagination, DataTableSearch, DataTableStates, DataTableToolbar } from '../../components/data-table'
import { EmptyState } from '../../components/feedback'
import { barangColumns } from '../../features/barang/columns'
import { getBarang } from '../../features/barang/queries'
import { parseBarangListSearch } from '../../validation/barang'
export const Route = createFileRoute('/_app/barang')({ validateSearch: (search) => parseBarangListSearch(search), loaderDeps: ({ search }) => ({ q: search.q, halaman: search.halaman }), loader: ({ deps }) => getBarang(deps), component: BarangPage })
function BarangPage() {
  const data = Route.useLoaderData(); const search = Route.useSearch(); const navigate = Route.useNavigate()
  const changeSearch = (patch: Partial<typeof search>) => navigate({ search: (old) => ({ ...old, ...patch }) })
  const empty = data.rows.length === 0; const searching = Boolean(search.q) && empty
  const description = 'Barang aktif dan stoknya. Untuk menambah atau mengubah barang, hubungi admin.'
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">Daftar barang</h1><p className="mt-1 text-base-content/70">{description}</p></header>
    <DataTableToolbar><DataTableSearch value={search.q} onChange={(q) => changeSearch({ q, halaman: 1 })}/></DataTableToolbar>
    {!empty && <DataTable columns={barangColumns()} data={data} caption="Daftar barang aktif" rowKey={(row) => String(row.id)}/>}
    {empty && searching && <DataTableStates isEmpty isSearchEmpty query={search.q} onClearSearch={() => changeSearch({ q: '', halaman: 1 })}/>}
    {empty && !searching && <EmptyState title="Belum ada barang. Hubungi admin untuk menambahkan barang."/>}
    {!empty && <DataTablePagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={(halaman) => changeSearch({ halaman })}/>}
  </section>
}
