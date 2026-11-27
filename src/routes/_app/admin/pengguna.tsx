import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";

import { DataTable } from "~/components/data-table";
import { EmptyState, ErrorState, Skeleton } from "~/components/feedback";
import { HeaderButton, PageHeader } from "~/components/page-header";
import { penggunaColumns } from "~/features/pengguna/columns";
import { PenggunaForm } from "~/features/pengguna/pengguna-form";
import { kasirListOptions, type KasirRow } from "~/features/pengguna/queries";
import { ResetPasswordForm } from "~/features/pengguna/reset-password-form";

export const Route = createFileRoute("/_app/admin/pengguna")({
  beforeLoad: ({ context }) => {
    if (context.session?.peran !== "admin") throw redirect({ to: "/" });
  },
  validateSearch: () => ({}),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(kasirListOptions()),
  component: AdminPenggunaPage,
});

function AdminPenggunaPage() {
  const {
    data: rows,
    isPending,
    isError,
    refetch,
  } = useQuery(kasirListOptions());
  const isAdmin = Route.useRouteContext().session?.peran === "admin";
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<KasirRow | null>(null);

  if (isError)
    return (
      <ErrorState
        onRetry={() => {
          void refetch();
        }}
      />
    );

  if (isPending && !rows)
    return (
      <Skeleton
        variant="table-rows"
        count={3}
      />
    );

  const columns = penggunaColumns((row) => (
    <button
      className="btn btn-outline btn-sm"
      onClick={() => setResetting(row)}
    >
      Reset password
    </button>
  ));
  const data = {
    rows,
    total: rows.length,
    page: 1,
    pageSize: Math.max(1, rows.length),
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="Pengguna"
        description="Buat akun untuk kasir toko dan reset password jika diperlukan."
        actions={
          isAdmin ? (
            <HeaderButton
              icon={UserPlus}
              label="Buat akun kasir"
              variant="utama"
              onClick={() => setCreating(true)}
            />
          ) : undefined
        }
      />
      <section className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Daftar akun kasir</h2>
          {rows.length ? (
            <DataTable
              columns={columns}
              data={data}
              caption="Daftar akun kasir"
              rowKey={(row) => row.id}
            />
          ) : (
            <EmptyState
              title="Belum ada akun kasir."
              description="Buat akun kasir melalui tombol di atas."
            />
          )}
        </div>
      </section>
      {creating && (
        <PenggunaForm
          onClose={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}
      {resetting && (
        <ResetPasswordForm
          key={resetting.id}
          kasir={resetting}
          onDone={() => setResetting(null)}
        />
      )}
    </section>
  );
}
