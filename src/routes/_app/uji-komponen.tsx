import { revalidateLogic, useSelector } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as v from "valibot";

import { useConfirm } from "~/components/confirm";
import { FormAlert } from "~/components/form";
import { useAppForm } from "~/components/form/tanstack-spike";
import { Modal, ModalBody, ModalFooter } from "~/components/modal";
import { PageHeader } from "~/components/page-header";
import { toast } from "~/components/toast";
import { ApiError } from "~/lib/api";

export const Route = createFileRoute("/_app/uji-komponen")({
  component: UjiKomponenPage,
});

const FormUjiSchema = v.pipe(
  v.object({
    username: v.pipe(
      v.string(),
      v.nonEmpty("Nama pengguna wajib diisi."),
      v.minLength(3, "Nama pengguna minimal 3 karakter."),
    ),
    password: v.pipe(v.string(), v.nonEmpty("Kata sandi wajib diisi.")),
  }),
  v.forward(
    v.partialCheck(
      [["username"], ["password"]],
      (value) => value.username !== value.password,
      "Kata sandi tidak boleh sama dengan nama pengguna.",
    ),
    ["password"],
  ),
);

type FormUjiInput = v.InferOutput<typeof FormUjiSchema>;

async function kirimTiruan(input: FormUjiInput): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 900));

  if (input.username === "uji-gagal-isian")
    throw new ApiError({
      status: 422,
      message: "Periksa kembali isian form.",
      fields: { password: "Kata sandi ditolak oleh server tiruan." },
    });

  if (input.username === "uji-gagal-umum")
    throw new ApiError({
      status: 500,
      message: "Simulasi gagal. Coba lagi.",
      fields: {},
    });
}

export function UjiKomponenPage() {
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-5">
      <PageHeader
        title="Uji komponen"
        description="Percobaan pola TanStack Form. Data hanya dikirim ke fungsi tiruan dan tidak disimpan."
      />
      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <p>
            Buka form untuk mencoba validasi saat isian ditinggalkan, error
            server tiruan, konfirmasi saat menutup, dan penguncian saat
            menyimpan.
          </p>
          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setOpen(true)}
            >
              Buka form uji
            </button>
          </div>
        </div>
      </div>
      {open ? <FormUjiModal onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

function FormUjiModal({ onClose }: { onClose: () => void }) {
  const confirm = useConfirm();
  const [formMessage, setFormMessage] = useState("");
  const mutation = useMutation({
    mutationKey: ["uji-komponen", "simpan-tiruan"],
    mutationFn: kirimTiruan,
  });

  const form = useAppForm({
    defaultValues: { username: "", password: "" },
    validationLogic: revalidateLogic({
      mode: "blur",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: FormUjiSchema },
    onSubmit: async ({ value, formApi }) => {
      setFormMessage("");
      formApi.setErrorMap({ onSubmit: undefined });
      try {
        await mutation.mutateAsync(value);
        toast.success("Form uji berhasil dikirim.");
        formApi.reset();
        onClose();
      } catch (error) {
        if (error instanceof ApiError) {
          const fields: Partial<Record<keyof FormUjiInput, string>> = {};
          if (error.fields.username) fields.username = error.fields.username;
          if (error.fields.password) fields.password = error.fields.password;
          formApi.setErrorMap({
            onSubmit: { form: error.message, fields },
          });
          setFormMessage(error.message);
        } else {
          setFormMessage("Form uji gagal dikirim. Coba lagi.");
        }
      }
    },
  });
  const isDirty = useSelector(form.store, (state) => state.isDirty);
  const isPending = mutation.isPending;

  async function requestClose() {
    if (isPending) return;
    if (
      isDirty &&
      !(await confirm({
        title: "Buang perubahan?",
        message: "Isian yang belum disimpan akan hilang.",
        cancelText: "Tetap mengisi",
        confirmText: "Buang isian",
        danger: true,
      }))
    )
      return;
    onClose();
  }

  return (
    <Modal
      open
      onClose={() => void requestClose()}
      title="Form uji TanStack Form"
      locked={isPending}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ModalBody className="space-y-4">
          <form.AppField
            name="username"
            children={(field) => (
              <field.TextField
                label="Nama pengguna"
                required
                autoComplete="username"
                placeholder="Contoh: aksar"
              />
            )}
          />
          <form.AppField
            name="password"
            children={(field) => (
              <field.TextField
                label="Kata sandi"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Ketik kata sandi"
              />
            )}
          />
          <FormAlert message={formMessage} />
          <p
            className="text-sm text-base-content/70"
            role="status"
          >
            Isian berubah: {isDirty ? "ya" : "belum"}. Untuk simulasi error
            server, gunakan nama pengguna <code>uji-gagal-isian</code> atau{" "}
            <code>uji-gagal-umum</code>.
          </p>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isPending}
            onClick={() => void requestClose()}
          >
            Batal
          </button>
          <form.AppForm>
            <form.FormSubmitButton
              loading={isPending}
              disabled={isPending}
            >
              Uji simpan
            </form.FormSubmitButton>
          </form.AppForm>
        </ModalFooter>
      </form>
    </Modal>
  );
}
