import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  DataTable,
  DataTableSearch,
  DataTableStates,
  DataTableToolbar,
} from '../../components/data-table'
import { EmptyState, ErrorState, Skeleton } from '../../components/feedback'
import { PageHeader } from '../../components/page-header'
import { barangColumns } from '../../features/barang/columns'
import { barangListOptions } from '../../features/barang/queries'
import { parseBarangListSearch } from '../../validation/barang'

export const Route = createFileRoute('/_app/barang')({
  validateSearch: (search) => parseBarangListSearch(search),
  loaderDeps: ({ search }) => ({ q: search.q, halaman: search.halaman }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(barangListOptions(deps)),
  component: BarangPage,
})

function BarangPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isPending, isError, refetch } = useQuery(barangListOptions(search))
  const changeSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (old) => ({ ...old, ...patch }) })
  if (isError)
    return (
      <ErrorState
        onRetry={() => {
          void refetch()
        }}
      />
    )
  if (isPending && !data) return <Skeleton variant="table-rows" count={5} />
  const empty = data.rows.length === 0
  const searching = Boolean(search.q) && empty
  const description =
    'Barang aktif dan stoknya. Untuk menambah atau mengubah barang, hubungi admin.'

  return (
    <section className="space-y-5">
      <PageHeader title="Daftar barang" description={description} />
      <DataTableToolbar>
        <DataTableSearch value={search.q} onChange={(q) => changeSearch({ q, halaman: 1 })} />
      </DataTableToolbar>
      {!empty && (
        <DataTable
          columns={barangColumns()}
          data={data}
          caption="Daftar barang aktif"
          rowKey={(row) => String(row.id)}
          onPageChange={(halaman) => changeSearch({ halaman })}
        />
      )}
      {empty && searching && (
        <DataTableStates
          isEmpty
          isSearchEmpty
          query={search.q}
          onClearSearch={() => changeSearch({ q: '', halaman: 1 })}
        />
      )}
      {empty && !searching && (
        <EmptyState title="Belum ada barang. Hubungi admin untuk menambahkan barang." />
      )}
    </section>
  )
}
