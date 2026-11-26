import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Package, Users } from 'lucide-react'
import { PageHeader } from '../../../components/page-header'

export const Route = createFileRoute('/_app/admin/')({ beforeLoad: ({ context }) => { if (context.session?.peran !== 'admin') throw redirect({ to: '/' }) }, component: AdminHome })

function AdminHome() {
  return <section className="space-y-5"><PageHeader title="Pengelolaan toko" description="Pilih bagian yang ingin dikelola."/><div className="grid gap-4 sm:grid-cols-2"><Link to="/admin/barang" search={{ q: '', halaman: 1, status: 'aktif' }} className="card border border-base-300 bg-base-100 transition hover:bg-base-200"><div className="card-body"><Package aria-hidden="true"/><h2 className="card-title">Kelola barang</h2><p>Tambah barang, ubah data dan harga jual, serta atur status.</p></div></Link><Link to="/admin/pengguna" className="card border border-base-300 bg-base-100 transition hover:bg-base-200"><div className="card-body"><Users aria-hidden="true"/><h2 className="card-title">Akun kasir</h2><p>Buat akun kasir dan reset password.</p></div></Link></div></section>
}
