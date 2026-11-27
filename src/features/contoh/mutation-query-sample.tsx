import {
  Form,
  isDirty,
  reset,
  setErrors,
  useField,
  useForm,
} from "@formisch/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useConfirm } from "~/components/confirm";
import { ErrorState, Skeleton } from "~/components/feedback";
import {
  FormAlert,
  FormSubmitButton,
  SelectField,
  TextField,
} from "~/components/form";
import {
  Modal,
  ModalBody,
  ModalFooter,
  useModalClose,
} from "~/components/modal";
import { toast } from "~/components/toast";
import { ApiError } from "~/lib/api";
import { ContohMutationSchema } from "~/validation/contoh-mutation";

import {
  contohMutasiOptions,
  healthQueryOptions,
  type ContohMutasiInput,
  type ContohMutasiHasil,
} from "./queries";

const simulationOptions = [
  { value: "sukses", label: "Berhasil" },
  {
    value: "isian",
    label: "Gagal dengan pesan pada isian",
  },
  { value: "umum", label: "Gagal dengan pesan umum" },
  { value: "sesi", label: "Sesi berakhir (401)" },
];

async function kirimContohTiruan(
  input: ContohMutasiInput,
): Promise<ContohMutasiHasil> {
  await new Promise((resolve) => window.setTimeout(resolve, 700));
  if (input.simulasi === "isian") {
    throw new ApiError({
      status: 422,
      message: "Periksa kembali isian form.",
      fields: {
        nama: "Nama ini tidak dapat digunakan pada simulasi.",
      },
    });
  }
  if (input.simulasi === "umum") {
    throw new ApiError({
      status: 500,
      message: "Simulasi gagal. Coba lagi.",
      fields: {},
    });
  }
  if (input.simulasi === "sesi") {
    throw new ApiError({
      status: 401,
      message: "Silakan masuk kembali.",
      fields: {},
    });
  }
  return { message: "Contoh berhasil disimpan." };
}

export function MutationQuerySample() {
  const [open, setOpen] = useState(false);
  const { data, isPending, isError, refetch } = useQuery(healthQueryOptions());
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title">Contoh TanStack Query</h2>
          <p>
            Data contoh dibaca dari GET /api/health. Form di bawah memakai
            pengirim tiruan, tidak menyimpan data toko.
          </p>
        </div>
        {isPending && !data && (
          <Skeleton
            variant="text"
            count={1}
          />
        )}
        {isError && !data && (
          <ErrorState
            onRetry={() => {
              void refetch();
            }}
          />
        )}
        {data && (
          <p
            role="status"
            className="alert alert-success"
          >
            Status server: {data.status}
          </p>
        )}
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setOpen(true)}
          >
            Uji alur simpan
          </button>
        </div>
      </div>
      {open && <ContohMutationModal onClose={() => setOpen(false)} />}
    </section>
  );
}

function ContohMutationModal({ onClose }: { onClose: () => void }) {
  const form = useForm({
    schema: ContohMutationSchema,
    initialInput: { nama: "", simulasi: "sukses" as const },
  });
  const mutation = useMutation(contohMutasiOptions(kirimContohTiruan));
  const confirm = useConfirm();
  const [message, setMessage] = useState("");
  const nama = useField(form, { path: ["nama"] });
  const simulasi = useField(form, { path: ["simulasi"] });

  async function closeGuard() {
    if (!isDirty(form)) return true;
    return confirm({
      title: "Buang perubahan?",
      message: "Isian yang belum disimpan akan hilang.",
      cancelText: "Tetap mengisi",
      confirmText: "Buang isian",
      danger: true,
    });
  }

  async function submit(input: ContohMutasiInput) {
    setMessage("");
    setErrors(form, { path: ["nama"], errors: null });
    try {
      await mutation.mutateAsync(input);
      reset(form);
      toast.success("Contoh berhasil disimpan.");
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldError = error.fields.nama;
        if (fieldError) {
          setErrors(form, {
            path: ["nama"],
            errors: [fieldError],
          });
        } else if (error.status !== 401) {
          setMessage(error.message);
        }
      } else {
        setMessage("Contoh gagal dikirim. Periksa koneksi lalu coba lagi.");
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Uji kirim form"
      size="sedang"
      canClose={!mutation.isPending}
      closeGuard={closeGuard}
    >
      <Form
        of={form}
        onSubmit={submit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ModalBody className="space-y-4">
          <TextField
            field={nama}
            label="Nama contoh"
            required
            placeholder="Contoh: Beras eceran"
          />
          <SelectField
            field={simulasi}
            label="Hasil simulasi"
            required
            options={simulationOptions}
          />
          <FormAlert message={message} />
          <p className="text-sm text-base-content/70">
            Saat kiriman berjalan, tombol simpan dan penutupan modal akan
            dikunci.
          </p>
        </ModalBody>
        <ModalFooter>
          <TutupButton loading={mutation.isPending} />
          <FormSubmitButton loading={mutation.isPending}>
            Kirim contoh
          </FormSubmitButton>
        </ModalFooter>
      </Form>
    </Modal>
  );
}

function TutupButton({ loading }: { loading: boolean }) {
  const close = useModalClose();
  return (
    <button
      type="button"
      className="btn btn-ghost"
      disabled={loading}
      onClick={close}
    >
      Batal
    </button>
  );
}
