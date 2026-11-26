import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
  useLoaderData,
} from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Menu, Package, Shield, ShoppingCart, Wallet, Warehouse } from 'lucide-react'
import { ThemeToggle } from '../components/theme/theme-toggle'
import { toast } from '../components/toast/toast-store'
import { authClient } from '../lib/auth-client'
import { safeReturnTarget } from '../validation/search'
import { useConfirm } from '../components/confirm/use-confirm'
import { useCart } from '../features/kasir/cart-store'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context, location }) => {
    if (!context.session)
      throw redirect({
        to: '/login',
        search: {
          kembali: safeReturnTarget(location.href),
          sesiBerakhir: context.sessionCookiePresent ? '1' : undefined,
        },
      })
  },
  component: AppLayout,
})

function AppLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const cart = useCart()
  const rootData = useLoaderData({ from: '__root__' })
  const session = Route.useRouteContext({ select: (context) => context.session })
  async function logout() {
    if (
      cart.length &&
      !(await confirm({
        title: 'Keranjang belum kosong',
        message: 'Jika keluar sekarang, isi keranjang akan hilang. Tetap keluar?',
        confirmText: 'Tetap keluar',
        danger: true,
      }))
    )
      return
    await authClient.signOut()
    queryClient.clear()
    await router.invalidate()
    toast.success('Anda telah keluar.')
    await router.navigate({ to: '/login', search: { kembali: '/' } })
  }
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <header className="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100 px-3 sm:px-6">
        <div className="navbar-start gap-2">
          <div className="dropdown md:hidden">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-square min-h-11"
              aria-label="Buka navigasi"
            >
              <Menu />
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-30 mt-3 w-56 rounded-box bg-base-200 p-2 shadow"
            >
              <li>
                <Link to="/">Beranda</Link>
              </li>
              <li>
                <Link to="/barang" search={{ q: '', halaman: 1 }}>
                  <Package className="size-4" /> Barang
                </Link>
              </li>
              {session?.peran === 'admin' && (
                <li>
                  <Link to="/admin">
                    <Shield className="size-4" /> Admin
                  </Link>
                </li>
              )}
              <li>
                <Link to="/barang-masuk" search={{ q: '', dari: '', sampai: '', halaman: 1 }}>
                  <Warehouse className="size-4" /> Barang masuk
                </Link>
              </li>
              <li>
                <Link to="/kasir">
                  <ShoppingCart className="size-4" /> Kasir
                </Link>
              </li>
              <li>
                <Link to="/utang" search={{ q: '', status: 'belum-lunas', halaman: 1 }}>
                  <Wallet className="size-4" /> Utang
                </Link>
              </li>
              <li>
                <Link to="/uji-komponen">Uji komponen</Link>
              </li>
            </ul>
          </div>
          <Link to="/" className="btn btn-ghost text-lg font-bold">
            Kasiar
          </Link>
        </div>
        <nav className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal gap-1">
            <li>
              <Link to="/barang" search={{ q: '', halaman: 1 }}>
                <Package className="size-4" /> Barang
              </Link>
            </li>
            <li>
              <Link to="/barang-masuk" search={{ q: '', dari: '', sampai: '', halaman: 1 }}>
                <Warehouse className="size-4" /> Barang masuk
              </Link>
            </li>
            <li>
              <Link to="/kasir">
                <ShoppingCart className="size-4" /> Kasir
              </Link>
            </li>
            <li>
              <Link to="/utang" search={{ q: '', status: 'belum-lunas', halaman: 1 }}>
                <Wallet className="size-4" /> Utang
              </Link>
            </li>
            {session?.peran === 'admin' && (
              <li>
                <Link to="/admin">
                  <Shield className="size-4" /> Admin
                </Link>
              </li>
            )}
            <li>
              <Link to="/uji-komponen">Uji komponen</Link>
            </li>
          </ul>
        </nav>
        <div className="navbar-end gap-2">
          <ThemeToggle initialTheme={rootData?.theme ?? null} />
          <button type="button" className="btn btn-outline min-h-11" onClick={logout}>
            Keluar
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
