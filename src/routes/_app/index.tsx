import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/page-header";

export const Route = createFileRoute("/_app/")({
  component: AppHome,
});

function AppHome() {
  return (
    <section className="space-y-5">
      <PageHeader
        title="Beranda"
        description="Ringkasan dan akses fitur toko."
      />
      <div className="hero rounded-box bg-base-200 px-4 py-10 sm:px-10">
        <div className="hero-content text-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Selamat datang di Kasiar
            </h2>
            <p className="py-4">
              Pilih Barang, Barang masuk, Kasir, Utang, atau Admin dari menu
              untuk melanjutkan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
