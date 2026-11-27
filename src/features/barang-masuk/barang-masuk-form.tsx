import { Form, reset, setErrors, useField, useForm } from "@formisch/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { useConfirm } from "~/components/confirm";
import {
  FormAlert,
  FormSubmitButton,
  DateField,
  NumberField,
  RupiahField,
  TextField,
} from "~/components/form";
import { toast } from "~/components/toast";
import { ApiRequestError } from "~/lib/api";
import { formatRupiah } from "~/lib/format";
import {
  BarangMasukSchema,
  isJumlahValidUntukSatuan,
  type BarangMasukInput,
} from "~/validation/barang-masuk";

import { BarangSelectField } from "../barang/barang-select-field";
import { simpanBarangMasukMutationOptions, type PilihanBarang } from "./queries";

function tanggalHariIniLokal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isPriceWarning(
  value: unknown,
): value is { type: "harga-beli-di-atas-jual"; hargaBeli: number; hargaJual: number } {
  if (typeof value !== "object" || value === null) return false;
  const warning = value as Record<string, unknown>;
  return (
    warning.type === "harga-beli-di-atas-jual" &&
    typeof warning.hargaBeli === "number" &&
    typeof warning.hargaJual === "number"
  );
}

export function BarangMasukForm() {
  const confirm = useConfirm();
  const mutation = useMutation(simpanBarangMasukMutationOptions());
  const form = useForm({
    schema: BarangMasukSchema,
    initialInput: { tanggal: "", barangId: 0, jumlah: 0, hargaBeli: 0, pemasok: "" },
  });
  const tanggal = useField(form, { path: ["tanggal"] });
  const barangField = useField(form, { path: ["barangId"] });
  const jumlah = useField(form, { path: ["jumlah"] });
  const hargaBeli = useField(form, { path: ["hargaBeli"] });
  const pemasok = useField(form, { path: ["pemasok"] });
  const selectRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<PilihanBarang | null>(null);
  const [message, setMessage] = useState("");

  // Tanggal bawaan dihitung di browser agar zona waktu tidak menimbulkan perbedaan SSR.
  useEffect(() => {
    if (!tanggal.input) tanggal.onChange(tanggalHariIniLokal());
  }, [tanggal]);

  async function submit(input: BarangMasukInput) {
    setMessage("");
    setErrors(form, { path: ["tanggal"], errors: null });
    setErrors(form, { path: ["barangId"], errors: null });
    setErrors(form, { path: ["jumlah"], errors: null });
    setErrors(form, { path: ["hargaBeli"], errors: null });
    setErrors(form, { path: ["pemasok"], errors: null });
    if (!selected || selected.id !== input.barangId) {
      setMessage("Pilih barang yang tersedia.");
      selectRef.current?.focus();
      return;
    }
    if (!isJumlahValidUntukSatuan(input.jumlah, selected.satuan)) {
      setMessage("Jumlah untuk satuan ini harus bilangan bulat.");
      return;
    }
    try {
      let hargaJualDikonfirmasi: number | undefined;
      while (true) {
        try {
          await mutation.mutateAsync({ input, hargaJualDikonfirmasi });
          break;
        } catch (error) {
          if (!(error instanceof ApiRequestError) || !isPriceWarning(error.details)) throw error;
          const warning = error.details;
          const proceed = await confirm({
            title: "Periksa harga beli",
            message: `Harga beli ${formatRupiah(warning.hargaBeli)} lebih tinggi dari harga jual ${formatRupiah(warning.hargaJual)}. Periksa kembali sebelum menyimpan.`,
            confirmText: "Tetap simpan",
            cancelText: "Periksa lagi",
          });
          if (!proceed) return;
          hargaJualDikonfirmasi = warning.hargaJual;
        }
      }
      toast.success("Barang masuk tersimpan.");
      reset(form);
      tanggal.onChange(tanggalHariIniLokal());
      setSelected(null);
      setMessage("");
      window.setTimeout(() => selectRef.current?.focus(), 0);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fields.tanggal)
          setErrors(form, { path: ["tanggal"], errors: [error.fields.tanggal] });
        if (error.fields.barangId)
          setErrors(form, { path: ["barangId"], errors: [error.fields.barangId] });
        if (error.fields.jumlah)
          setErrors(form, { path: ["jumlah"], errors: [error.fields.jumlah] });
        if (error.fields.hargaBeli)
          setErrors(form, { path: ["hargaBeli"], errors: [error.fields.hargaBeli] });
        if (error.fields.pemasok)
          setErrors(form, { path: ["pemasok"], errors: [error.fields.pemasok] });
        setMessage(error.message);
      } else setMessage("Barang masuk tidak dapat disimpan. Periksa koneksi lalu coba lagi.");
    }
  }

  return (
    <Form
      of={form}
      onSubmit={submit}
      className="card border border-base-300 bg-base-100"
    >
      <div className="card-body gap-4">
        <h2 className="card-title">Catat barang masuk</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            field={tanggal}
            label="Tanggal"
            required
          />
          <BarangSelectField
            field={barangField}
            selected={selected}
            inputRef={selectRef}
            onSelected={(item) => setSelected(item)}
          />
          <NumberField
            field={jumlah}
            label="Jumlah"
            decimals={selected?.satuan === "kg" ? 1 : 0}
            required
            hint={
              selected
                ? `Satuan: ${selected.satuan}${selected.satuan === "kg" ? " — boleh satu angka di belakang koma." : " — harus bilangan bulat."}`
                : "Pilih barang untuk melihat satuannya."
            }
          />
          <RupiahField
            field={hargaBeli}
            label="Harga beli"
            required
            hint="Masukkan harga beli per satuan dalam rupiah bulat."
          />
          <TextField
            field={pemasok}
            label="Pemasok"
            placeholder="Nama pemasok (opsional)"
          />
        </div>
        <FormAlert message={message} />
        <div className="flex justify-end">
          <FormSubmitButton loading={mutation.isPending}>Simpan barang masuk</FormSubmitButton>
        </div>
      </div>
    </Form>
  );
}
