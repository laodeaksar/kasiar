import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { PageHeader } from '../../components/page-header'

export const Route = createFileRoute('/_app/')({ component: AppHome })

function AppHome() {
  return <section className="space-y-5">
    <PageHeader title="Beranda" description="Ringkasan dan akses fitur toko."/>
    <div className="hero rounded-box bg-base-200 px-4 py-10 sm:px-10"><div className="hero-content text-center"><div className="max-w-xl"><p className="badge badge-primary badge-outline">Fondasi tampilan</p><h2 className="mt-4 text-3xl font-bold sm:text-4xl">Kasiar</h2><p className="py-4">Kerangka tampilan dasar sudah siap. Fitur pencatatan barang akan dibuat pada tahap berikutnya.</p><Link className="btn btn-primary min-h-12" to="/uji-komponen">Buka halaman uji komponen <ArrowRight aria-hidden="true"/></Link></div></div></div>
    <div className="card border border-base-300 bg-base-100"><div className="card-body sm:flex-row sm:items-center"><ClipboardList className="size-8 text-primary" aria-hidden="true"/><div><h2 className="card-title">Belum ada data atau fitur stok</h2><p>Halaman ini hanya menjadi kerangka fondasi, sesuai lingkup Tahap 1.</p></div></div></div>
  </section>
}
