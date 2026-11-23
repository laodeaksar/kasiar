import { createFileRoute, Link, Outlet, useLoaderData } from '@tanstack/react-router'
import { Menu, Package, ShoppingCart, Warehouse } from 'lucide-react'
import { ThemeToggle } from '../components/theme/theme-toggle'

export const Route = createFileRoute('/_app')({ component: AppLayout })

function AppLayout() {
  const rootData = useLoaderData({ from: '__root__' })
  return <div className="min-h-screen bg-base-100 text-base-content">
    <header className="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100 px-3 sm:px-6">
      <div className="navbar-start gap-2"><div className="dropdown md:hidden"><button tabIndex={0} className="btn btn-ghost btn-square min-h-11" aria-label="Buka navigasi"><Menu/></button><ul tabIndex={0} className="menu dropdown-content z-30 mt-3 w-56 rounded-box bg-base-200 p-2 shadow"><li><Link to="/">Beranda</Link></li><li><a href="#barang">Barang</a></li><li><a href="#barang-masuk">Barang masuk</a></li><li><a href="#kasir">Kasir</a></li><li><Link to="/uji-komponen">Uji komponen</Link></li></ul></div><Link to="/" className="btn btn-ghost text-lg font-bold">Kasiar</Link></div>
      <nav className="navbar-center hidden md:flex"><ul className="menu menu-horizontal gap-1"><li><a href="#barang"><Package className="size-4"/> Barang</a></li><li><a href="#barang-masuk"><Warehouse className="size-4"/> Barang masuk</a></li><li><a href="#kasir"><ShoppingCart className="size-4"/> Kasir</a></li><li><Link to="/uji-komponen">Uji komponen</Link></li></ul></nav>
      <div className="navbar-end"><ThemeToggle initialTheme={rootData?.theme ?? null}/></div>
    </header>
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6"><Outlet/></main>
  </div>
}
