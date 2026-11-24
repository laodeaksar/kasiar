import { createFileRoute, Link, Outlet, redirect, useRouter, useLoaderData } from '@tanstack/react-router'
import { Menu, Package, Shield, ShoppingCart, Warehouse } from 'lucide-react'
import { ThemeToggle } from '../components/theme/theme-toggle'
import { useToast } from '../components/toast/toast-provider'
import { authClient } from '../lib/auth-client'
import { safeReturnTarget } from '../validation/search'

export const Route = createFileRoute('/_app')({ beforeLoad: ({ context, location }) => { if (!context.session) throw redirect({ to: '/login', search: { kembali: safeReturnTarget(location.href), sesiBerakhir: context.sessionCookiePresent ? '1' : undefined } }) }, component: AppLayout })

function AppLayout() {
  const router = useRouter(); const { showToast } = useToast()
  const rootData = useLoaderData({ from: '__root__' })
  const session = Route.useRouteContext({ select: (context) => context.session })
  async function logout() { await authClient.signOut(); await router.invalidate(); showToast('sukses', 'Anda telah keluar.'); await router.navigate({ to: '/login', search: { kembali: '/' } }) }
  return <div className="min-h-screen bg-base-100 text-base-content">
    <header className="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100 px-3 sm:px-6">
      <div className="navbar-start gap-2"><div className="dropdown md:hidden"><button tabIndex={0} className="btn btn-ghost btn-square min-h-11" aria-label="Buka navigasi"><Menu/></button><ul tabIndex={0} className="menu dropdown-content z-30 mt-3 w-56 rounded-box bg-base-200 p-2 shadow"><li><Link to="/">Beranda</Link></li><li><Link to="/barang" search={{ q: '', halaman: 1 }}><Package className="size-4"/> Barang</Link></li>{session?.peran === 'admin' && <li><Link to="/admin"><Shield className="size-4"/> Admin</Link></li>}<li><a href="#barang-masuk"><Warehouse className="size-4"/> Barang masuk</a></li><li><a href="#kasir"><ShoppingCart className="size-4"/> Kasir</a></li><li><Link to="/uji-komponen">Uji komponen</Link></li></ul></div><Link to="/" className="btn btn-ghost text-lg font-bold">Kasiar</Link></div>
      <nav className="navbar-center hidden md:flex"><ul className="menu menu-horizontal gap-1"><li><Link to="/barang" search={{ q: '', halaman: 1 }}><Package className="size-4"/> Barang</Link></li><li><a href="#barang-masuk"><Warehouse className="size-4"/> Barang masuk</a></li><li><a href="#kasir"><ShoppingCart className="size-4"/> Kasir</a></li>{session?.peran === 'admin' && <li><Link to="/admin"><Shield className="size-4"/> Admin</Link></li>}<li><Link to="/uji-komponen">Uji komponen</Link></li></ul></nav>
      <div className="navbar-end gap-2"><ThemeToggle initialTheme={rootData?.theme ?? null}/><button type="button" className="btn btn-outline min-h-11" onClick={logout}>Keluar</button></div>
    </header>
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6"><Outlet/></main>
  </div>
}
