import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Menu,
  Package,
  Shield,
  ShoppingCart,
  Wallet,
  Warehouse,
  X,
} from "lucide-react";
import { useState } from "react";

import { useConfirm } from "~/components/confirm";
import { ThemeToggle, ThemeToggleCompact } from "~/components/theme/theme-toggle";
import { toast } from "~/components/toast";
import { useCart } from "~/features/kasir/cart-store";
import { authClient } from "~/lib/auth-client";
import { safeReturnTarget } from "~/validation/search";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context, location }) => {
    if (!context.session)
      throw redirect({
        to: "/login",
        search: {
          kembali: safeReturnTarget(location.href),
          sesiBerakhir: context.sessionCookiePresent ? "1" : undefined,
        },
      });
  },
  component: AppLayout,
});

type NavItemProps = {
  to: "/" | "/barang" | "/barang-masuk" | "/kasir" | "/utang" | "/admin";
  label: string;
  icon: React.ReactNode;
  onNavigate: () => void;
  search?: Record<string, string | number>;
};

function NavItem({ to, label, icon, onNavigate, search }: NavItemProps) {
  return (
    <li>
      <Link
        to={to}
        search={search}
        onClick={onNavigate}
        activeProps={{ className: "menu-active" }}
      >
        {icon}
        {label}
      </Link>
    </li>
  );
}

function AppLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const cart = useCart();
  const rootData = useLoaderData({ from: "__root__" });
  const session = Route.useRouteContext({ select: (context) => context.session });
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  async function logout() {
    if (
      cart.length &&
      !(await confirm({
        title: "Keranjang belum kosong",
        message: "Jika keluar sekarang, isi keranjang akan hilang. Tetap keluar?",
        confirmText: "Tetap keluar",
        danger: true,
      }))
    )
      return;

    await authClient.signOut();
    queryClient.clear();
    await router.invalidate();
    toast.success("Anda telah keluar.");
    await router.navigate({ to: "/login", search: { kembali: "/" } });
  }

  return (
    <div className="drawer min-h-screen lg:drawer-open">
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={open}
        onChange={(event) => setOpen(event.target.checked)}
      />

      <div className="drawer-content flex min-h-screen min-w-0 flex-col overflow-hidden">
        <header className="navbar sticky top-0 z-20 min-h-14 border-b border-base-300 bg-base-100 px-2 lg:hidden">
          <label
            htmlFor="app-drawer"
            className="btn btn-square btn-ghost"
            aria-label="Buka menu"
          >
            <Menu className="size-6" />
          </label>
          <Link
            to="/"
            className="ml-1 flex-1 truncate text-lg font-bold"
          >
            Kasiar
          </Link>
          <ThemeToggleCompact initialTheme={rootData?.theme ?? null} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-40">
        <label
          htmlFor="app-drawer"
          aria-label="Tutup menu"
          className="drawer-overlay"
        />
        <aside className="flex min-h-full w-72 flex-col border-r border-base-300 bg-base-100">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-base-300 px-5">
            <Link
              to="/"
              onClick={close}
              className="text-xl font-bold"
            >
              Kasiar
            </Link>
            <label
              htmlFor="app-drawer"
              className="btn btn-square btn-ghost lg:hidden"
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </label>
          </div>

          <ul className="menu w-full flex-1 gap-1 p-3">
            <NavItem
              to="/"
              label="Beranda"
              icon={<LayoutDashboard className="size-5" />}
              onNavigate={close}
            />
            <li className="menu-title mt-3">Operasional</li>
            <NavItem
              to="/kasir"
              label="Kasir"
              icon={<ShoppingCart className="size-5" />}
              onNavigate={close}
            />
            <NavItem
              to="/barang-masuk"
              label="Barang masuk"
              icon={<Warehouse className="size-5" />}
              onNavigate={close}
              search={{ q: "", dari: "", sampai: "", halaman: 1 }}
            />
            <NavItem
              to="/utang"
              label="Utang"
              icon={<Wallet className="size-5" />}
              onNavigate={close}
              search={{ q: "", status: "belum-lunas", halaman: 1 }}
            />
            <li className="menu-title mt-3">Data</li>
            <NavItem
              to="/barang"
              label="Barang"
              icon={<Package className="size-5" />}
              onNavigate={close}
              search={{ q: "", halaman: 1 }}
            />
            {session?.peran === "admin" && (
              <NavItem
                to="/admin"
                label="Admin"
                icon={<Shield className="size-5" />}
                onNavigate={close}
              />
            )}
          </ul>

          <div className="shrink-0 space-y-3 border-t border-base-300 p-4">
            <ThemeToggle initialTheme={rootData?.theme ?? null} />
            <button
              type="button"
              className="btn btn-outline w-full"
              onClick={logout}
            >
              Keluar
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
