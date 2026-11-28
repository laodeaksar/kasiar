import {
  Form,
  isDirty,
  reset,
  setErrors,
  useField,
  useForm,
} from "@formisch/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import type { BarangInput } from "~/validation/barang";

import { useConfirm } from "~/components/confirm";
import {
  FormAlert,
  FormSubmitButton,
  RupiahField,
  SelectField,
  TextField,
} from "~/components/form";
import { Modal, ModalBody, ModalFooter } from "~/components/modal";
import { toast } from "~/components/toast";
import { ApiError } from "~/lib/api";
import { formatRupiah } from "~/lib/format";
import { SATUAN_BARANG } from "~/lib/konstanta";
import { BarangSchema } from "~/validation/barang";

import {
  tambahBarangMutationOptions,
  ubahBarangMutationOptions,
  type BarangRow,
} from "./queries";

const satuanOptions = SATUAN_BARANG.map((value) => ({
  value,
  label: value === "kg" ? "Kilogram (kg)" : value,
}));

type BarangFormProps = {
  row: BarangRow | null;
  onSaved: () => void;
  onClose: () => void;
};

export function BarangForm({ row, onSaved, onClose }: BarangFormProps) {
  const form = useForm({
    schema: BarangSchema,
    initialInput: {
      nama: row?.nama ?? "",
      satuan: row?.satuan ?? "pcs",
      hargaJual: row?.hargaJual ?? 0,
    },
  });
  const confirm = useConfirm();
  const addMutation = useMutation(tambahBarangMutationOptions());
  const editMutation = useMutation(ubahBarangMutationOptions());
  const loading = addMutation.isPending || editMutation.isPending;
  const [message, setMessage] = useState("");

  async function requestClose() {
    if (!isDirty(form)) {
      onClose();
      return;
    }
    if (
      await confirm({
        title: "Buang perubahan?",
        message: "Isian yang belum disimpan akan hilang",
        cancelText: row ? "Tetap mengedit" : "Tetap mengisi",
        confirmText: "Buang isian",
        danger: true,
      })
    )
      onClose();
  }

  async function submit(input: BarangInput) {
    setMessage("");
    for (const field of ["nama", "satuan", "hargaJual"] as const)
      setErrors(form, { path: [field], errors: null });

    if (!row) {
      try {
        await addMutation.mutateAsync(input);
        reset(form);
        toast.success("Barang ditambahkan.");
        onSaved();
      } catch (error) {
        showError(
          error,
          "Barang tidak dapat ditambahkan. Periksa koneksi lalu coba lagi.",
        );
      }
      return;
    }

    const nameChanged = input.nama !== row.nama || input.satuan !== row.satuan;
    const priceChanged = input.hargaJual !== row.hargaJual;
    if (!nameChanged && !priceChanged) {
      onClose();
      return;
    }

    if (
      nameChanged &&
      !(await confirm({
        title: "Yakin?",
        message: `Ubah data “${row.nama}”?${input.satuan !== row.satuan ? ` Mengubah satuan dari ${row.satuan} menjadi ${input.satuan} mengubah arti angka stok yang sudah tercatat.` : ""}`,
        confirmText: "Ubah data",
      }))
    )
      return;

    if (priceChanged) {
      const warning =
        row.hargaBeliTerakhir !== null &&
        row.hargaBeliTerakhir !== undefined &&
        input.hargaJual < row.hargaBeliTerakhir
          ? ` Peringatan: harga jual baru ${formatRupiah(input.hargaJual)} lebih rendah dari harga beli terakhir ${formatRupiah(row.hargaBeliTerakhir)}.`
          : "";
      if (
        !(await confirm({
          title: "Yakin?",
          message: `Ubah harga jual dari ${formatRupiah(row.hargaJual)} menjadi ${formatRupiah(input.hargaJual)}?${warning}`,
          confirmText: "Ubah harga",
        }))
      )
        return;
    }

    const changes: Record<string, unknown> = {};
    if (input.nama !== row.nama) changes.nama = input.nama;
    if (input.satuan !== row.satuan) changes.satuan = input.satuan;
    if (priceChanged) changes.hargaJual = input.hargaJual;

    try {
      await editMutation.mutateAsync({ id: row.id, input: changes });
      reset(form);
      toast.success("Data barang diperbarui.");
      onSaved();
    } catch (error) {
      showError(error, "Data barang tidak dapat diperbarui.");
    }
  }

  function showError(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      for (const field of ["nama", "satuan", "hargaJual"] as const) {
        const fieldMessage = error.fields[field];
        if (fieldMessage)
          setErrors(form, { path: [field], errors: [fieldMessage] });
      }
      setMessage(error.message);
    } else setMessage(fallback);
  }

  return (
    <Modal
      open
      onClose={requestClose}
      title={row ? "Ubah barang" : "Barang baru"}
    >
      <BarangFormFields
        form={form}
        message={message}
        loading={loading}
        editing={Boolean(row)}
        onClose={requestClose}
        onSubmit={submit}
      />
    </Modal>
  );
}

type BarangFormStore = ReturnType<typeof useForm<typeof BarangSchema>>;

function BarangFormFields({
  form,
  message,
  loading,
  editing,
  onClose,
  onSubmit,
}: {
  form: BarangFormStore;
  message: string;
  loading: boolean;
  editing: boolean;
  onClose: () => void | Promise<void>;
  onSubmit: (input: BarangInput) => Promise<void>;
}) {
  const nama = useField(form, { path: ["nama"] });
  const satuan = useField(form, { path: ["satuan"] });
  const hargaJual = useField(form, { path: ["hargaJual"] });

  return (
    <Form
      of={form}
      onSubmit={onSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModalBody className="grid content-start gap-4 sm:grid-cols-2">
        <TextField
          field={nama}
          label="Nama barang"
          required
          placeholder="Contoh: Beras eceran"
        />
        <SelectField
          field={satuan}
          label="Satuan"
          required
          options={satuanOptions}
        />
        <RupiahField
          field={hargaJual}
          label="Harga jual"
          required
          hint="Masukkan angka rupiah bulat."
        />
        <div className="sm:col-span-2">
          <FormAlert message={message} />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn"
          disabled={loading}
          onClick={() => void onClose()}
        >
          Batal
        </button>
        <FormSubmitButton loading={loading}>
          {editing ? "Simpan perubahan" : "Tambah barang"}
        </FormSubmitButton>
      </ModalFooter>
    </Form>
  );
}
