import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { DataTable } from '../../../components/data-table'
import { EmptyState } from '../../../components/feedback'
import { PenggunaForm } from '../../../features/pengguna/pengguna-form'
import { penggunaColumns } from '../../../features/pengguna/columns'
import { getKasir, type KasirRow } from '../../../features/pengguna/queries'
import { ResetPasswordForm } from '../../../features/pengguna/reset-password-form'

export const Route = createFileRoute('/_app/admin/pengguna')({ validateSearch: () => ({}), loader: () => getKasir(), component: AdminPenggunaPage })

function AdminPenggunaPage() {
  const rows = Route.useLoaderData()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<KasirRow | null>(null)
  const columns = penggunaColumns((row) => <button className="btn btn-outline btn-sm min-h-10" onClick={() => setResetting(row)}>Reset password</button>)
  const data = { rows, total: rows.length, page: 1, pageSize: Math.max(1, rows.length) }

  return <section className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-base-content/70">Admin</p><h1 className="text-2xl font-bold">Akun kasir</h1><p className="mt-1">Buat akun untuk kasir toko dan reset password jika diperlukan.</p></div><button className="btn btn-primary min-h-12" onClick={() => setCreating(true)}>Buat akun kasir</button></header>
    <section className="card border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">Daftar akun kasir</h2>{rows.length ? <DataTable columns={columns} data={data} caption="Daftar akun kasir" rowKey={(row) => row.id}/> : <EmptyState title="Belum ada akun kasir." description="Buat akun kasir melalui tombol di atas."/>}</div></section>
    {creating && <PenggunaForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); void router.invalidate() }}/>}
    {resetting && <ResetPasswordForm key={resetting.id} kasir={resetting} onDone={() => { setResetting(null); void router.invalidate() }}/>}
  </section>
}
