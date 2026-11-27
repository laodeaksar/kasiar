import { Home, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { useConfirm } from "../confirm/use-confirm";
import { HeaderButton, PageHeader } from "./index";

export function PageHeaderSamples() {
  const confirm = useConfirm();
  async function confirmExample() {
    await confirm({
      title: "Yakin?",
      message: "Ini hanya contoh konfirmasi. Tidak ada data yang dihapus.",
      confirmText: "Lanjutkan",
      danger: true,
    });
  }
  const oneAction = (
    <HeaderButton
      icon={Plus}
      label="Tambah"
      variant="utama"
      onClick={() => undefined}
    />
  );
  const twoActions = (
    <>
      <HeaderButton
        icon={Search}
        label="Cari"
        onClick={() => undefined}
      />
      <HeaderButton
        icon={Plus}
        label="Tambah"
        variant="utama"
        onClick={() => undefined}
      />
    </>
  );
  const threeActions = (
    <>
      <HeaderButton
        icon={Plus}
        label="Tambah"
        variant="utama"
        onClick={() => undefined}
      />
      <HeaderButton
        icon={Pencil}
        label="Ubah"
        onClick={() => undefined}
      />
      <HeaderButton
        icon={Trash2}
        label="Hapus"
        variant="bahaya"
        onClick={() => {
          void confirmExample();
        }}
      />
    </>
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Judul halaman dan tombol aksi</h2>
        <p className="mt-1 text-base-content/70">
          Bandingkan tampilan terang dan gelap. Ubah ukuran jendela untuk melihat ikon saja di HP
          serta ikon dan label mulai 640 px.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div
          data-theme="light"
          className="space-y-5 rounded-box border border-base-300 bg-base-100 p-4 text-base-content sm:p-6"
        >
          <h3 className="font-semibold">Tema terang</h3>
          <PageHeader
            headingLevel={2}
            title="Judul halaman dengan satu tombol"
            actions={oneAction}
          />
          <PageHeader
            headingLevel={2}
            title="Judul halaman dengan dua tombol"
            actions={twoActions}
          />
          <PageHeader
            headingLevel={2}
            title="Contoh tiga tombol: aksi utama, biasa, dan berbahaya"
            actions={threeActions}
          />
          <PageHeader
            headingLevel={2}
            title="Judul sangat panjang untuk memastikan teks dipotong dengan titik-titik dan tidak mendorong tombol keluar layar"
            description="Judul tetap satu baris; area tombol tetap terlihat."
            actions={threeActions}
          />
          <PageHeader
            headingLevel={2}
            title="Nonaktif, sedang memproses, dan tautan"
            actions={
              <>
                <HeaderButton
                  icon={Search}
                  label="Cari"
                  disabled
                  onClick={() => undefined}
                />
                <HeaderButton
                  icon={Plus}
                  label="Simpan"
                  loading
                  onClick={() => undefined}
                />
                <HeaderButton
                  icon={Home}
                  label="Beranda"
                  to="/"
                />
              </>
            }
          />
        </div>
        <div
          data-theme="dark"
          className="space-y-5 rounded-box border border-base-300 bg-base-100 p-4 text-base-content sm:p-6"
        >
          <h3 className="font-semibold">Tema gelap</h3>
          <PageHeader
            headingLevel={2}
            title="Judul halaman dengan satu tombol"
            actions={oneAction}
          />
          <PageHeader
            headingLevel={2}
            title="Judul halaman dengan dua tombol"
            actions={twoActions}
          />
          <PageHeader
            headingLevel={2}
            title="Contoh tiga tombol: aksi utama, biasa, dan berbahaya"
            actions={threeActions}
          />
          <PageHeader
            headingLevel={2}
            title="Judul sangat panjang untuk memastikan teks dipotong dengan titik-titik dan tidak mendorong tombol keluar layar"
            description="Judul tetap satu baris; area tombol tetap terlihat."
            actions={threeActions}
          />
          <PageHeader
            headingLevel={2}
            title="Nonaktif, sedang memproses, dan tautan"
            actions={
              <>
                <HeaderButton
                  icon={Search}
                  label="Cari"
                  disabled
                  onClick={() => undefined}
                />
                <HeaderButton
                  icon={Plus}
                  label="Simpan"
                  loading
                  onClick={() => undefined}
                />
                <HeaderButton
                  icon={Home}
                  label="Beranda"
                  to="/"
                />
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}
