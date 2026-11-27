import { Form, reset, useField, useForm } from "@formisch/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import * as v from "valibot";

import { useConfirm } from "~/components/confirm/use-confirm";
import { FormAlert, FormSubmitButton, NumberField, RupiahField } from "~/components/form";
import { HeaderButton, PageHeader } from "~/components/page-header";
import { toast } from "~/components/toast";
import { BarangSelectField } from "~/features/barang/barang-select-field";
import { addCartItem, clearCart, removeCartItem, useCart } from "~/features/kasir/cart-store";
import { simpanTransaksiMutationOptions } from "~/features/kasir/queries";
import { PembeliField } from "~/features/utang/pembeli-field";
import { ApiRequestError } from "~/lib/api";
import { formatRupiah, formatJumlah } from "~/lib/format";
import {
  TambahKeranjangSchema,
  TransaksiSchema,
  type TransaksiInput,
} from "~/validation/transaksi";

export const Route = createFileRoute("/_app/kasir")({ component: KasirPage });
function KasirPage() {
  const cart = useCart();
  const confirm = useConfirm();
  const mutation = useMutation(simpanTransaksiMutationOptions());
  const form = useForm({
    schema: TransaksiSchema,
    initialInput: {
      items: [],
      total: 0,
      barangId: 0,
      jumlah: 0,
      jumlahDibayar: 0,
      pembeliNama: "",
    },
  });
  const barangField = useField(form, { path: ["barangId"] });
  const jumlahField = useField(form, { path: ["jumlah"] });
  const itemsField = useField(form, { path: ["items"] });
  const totalField = useField(form, { path: ["total"] });
  const dibayar = useField(form, { path: ["jumlahDibayar"] });
  const pembeliNama = useField(form, { path: ["pembeliNama"] });
  const [selected, setSelected] = useState<{
    id: number;
    nama: string;
    satuan: string;
    hargaJual: number;
  } | null>(null);
  const [message, setMessage] = useState("");
  const total = cart.reduce((sum, item) => sum + item.hargaJual * item.jumlah, 0);
  const sisa = Math.max(0, total - (typeof dibayar.input === "number" ? dibayar.input : 0));
  useEffect(() => {
    itemsField.onChange(cart.map(({ barangId, jumlah }) => ({ barangId, jumlah })));
    totalField.onChange(total);
  }, [cart, total, itemsField, totalField]);
  function tambahItem() {
    const result = v.safeParse(TambahKeranjangSchema, {
      barangId: barangField.input,
      jumlah: jumlahField.input,
    });
    if (!result.success) {
      setMessage(result.issues[0].message);
      return;
    }
    if (!selected || selected.id !== result.output.barangId) {
      setMessage("Pilih barang yang tersedia.");
      return;
    }
    addCartItem({
      barangId: selected.id,
      nama: selected.nama,
      satuan: selected.satuan,
      hargaJual: selected.hargaJual,
      jumlah: result.output.jumlah,
    });
    setMessage("");
    barangField.onChange(0);
    jumlahField.onChange(0);
    setSelected(null);
  }
  async function submit(input: TransaksiInput) {
    setMessage("");
    if (sisa > 0) {
      const ok = await confirm({
        title: "Yakin?",
        message: `Pembeli: ${input.pembeliNama}\nTotal: ${formatRupiah(total)}\nDibayar: ${formatRupiah(input.jumlahDibayar)}\nSisa utang: ${formatRupiah(sisa)}`,
        confirmText: "Simpan transaksi",
      });
      if (!ok) return;
    }
    try {
      await mutation.mutateAsync({
        ...input,
        items: cart.map(({ barangId, jumlah }) => ({ barangId, jumlah })),
        total,
      });
      toast.success(
        sisa > 0
          ? `Transaksi tersimpan. Utang tercatat atas nama ${input.pembeliNama}.`
          : "Transaksi tersimpan.",
      );
      clearCart();
      reset(form);
      setSelected(null);
      setMessage("");
    } catch (error) {
      if (error instanceof ApiRequestError) setMessage(error.message);
      else setMessage("Transaksi tidak dapat disimpan. Periksa koneksi lalu coba lagi.");
    }
  }
  return (
    <section className="space-y-5">
      <PageHeader
        title="Kasir"
        description="Pilih barang, masukkan jumlah, lalu catat pembayaran."
        actions={
          cart.length ? (
            <HeaderButton
              icon={Trash2}
              label="Kosongkan keranjang"
              variant="bahaya"
              onClick={async () => {
                if (
                  await confirm({
                    title: "Yakin?",
                    message: `Kosongkan ${cart.length} item dari keranjang?`,
                    confirmText: "Kosongkan",
                    danger: true,
                  })
                )
                  clearCart();
              }}
            />
          ) : undefined
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <section className="card border border-base-300 bg-base-100">
          <div className="card-body gap-4">
            <h2 className="card-title">Tambah ke keranjang</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <BarangSelectField
                field={barangField}
                selected={selected}
                onSelected={setSelected}
              />
              <NumberField
                field={jumlahField}
                label="Jumlah"
                decimals={selected?.satuan === "kg" ? 1 : 0}
                required
                hint={selected ? `Satuan: ${selected.satuan}` : "Pilih barang terlebih dahulu."}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary self-end"
              onClick={tambahItem}
            >
              Tambah
            </button>
          </div>
        </section>
        <section className="card border border-base-300 bg-base-100">
          <div className="card-body gap-4">
            <h2 className="card-title">Keranjang</h2>
            {!cart.length ? (
              <p className="text-base-content/70">
                Keranjang masih kosong. Pilih barang untuk memulai.
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.barangId}
                    className="flex items-start justify-between gap-3 border-b border-base-300 pb-3"
                  >
                    <div>
                      <p className="font-medium">{item.nama}</p>
                      <p className="text-sm text-base-content/70">
                        {formatJumlah(item.jumlah, item.satuan)} × {formatRupiah(item.hargaJual)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatRupiah(item.jumlah * item.hargaJual)}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-square"
                        aria-label={`Hapus ${item.nama}`}
                        onClick={() => removeCartItem(item.barangId)}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <Form
        of={form}
        onSubmit={submit}
        className="card border border-base-300 bg-base-100"
      >
        <div className="card-body gap-4">
          <h2 className="card-title">Pembayaran</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <RupiahField
              field={dibayar}
              label="Jumlah dibayar"
              required
              hint="Isi 0 jika belum dibayar."
            />
            {sisa > 0 && <PembeliField field={pembeliNama} />}
          </div>
          <FormAlert message={message} />
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium">Sisa: {formatRupiah(sisa)}</p>
            <FormSubmitButton
              loading={mutation.isPending}
              disabled={!cart.length}
            >
              Simpan transaksi
            </FormSubmitButton>
          </div>
        </div>
      </Form>
    </section>
  );
}
