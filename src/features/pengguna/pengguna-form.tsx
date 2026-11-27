import { Form, isDirty, reset, setErrors, useField, useForm } from "@formisch/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useConfirm } from "~/components/confirm";
import { FormAlert, FormSubmitButton, PasswordField, TextField } from "~/components/form";
import { Modal, ModalBody, ModalFooter, useModalClose } from "~/components/modal";
import { toast } from "~/components/toast";
import { ApiRequestError } from "~/lib/api";
import { PenggunaSchema, type PenggunaInput } from "~/validation/pengguna";

import { buatKasirMutationOptions } from "./queries";

export function PenggunaForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const form = useForm({ schema: PenggunaSchema, initialInput: { username: "", password: "" } });
  const confirm = useConfirm();
  const mutation = useMutation(buatKasirMutationOptions());
  const [message, setMessage] = useState("");

  async function closeGuard() {
    if (!isDirty(form)) return true;
    return confirm({
      title: "Buang perubahan?",
      message: "Isian yang belum disimpan akan hilang",
      cancelText: "Tetap mengisi",
      confirmText: "Buang isian",
      danger: true,
    });
  }

  async function submit(input: PenggunaInput) {
    setMessage("");
    setErrors(form, { path: ["username"], errors: null });
    setErrors(form, { path: ["password"], errors: null });
    try {
      await mutation.mutateAsync(input);
      reset(form);
      toast.success("Akun kasir dibuat.");
      onSaved();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fields.username)
          setErrors(form, { path: ["username"], errors: [error.fields.username] });
        if (error.fields.password)
          setErrors(form, { path: ["password"], errors: [error.fields.password] });
        setMessage(error.message);
      } else setMessage("Akun kasir tidak dapat dibuat. Periksa koneksi lalu coba lagi.");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Buat akun kasir"
      size="sedang"
      canClose={!mutation.isPending}
      closeGuard={closeGuard}
    >
      <PenggunaFormFields
        form={form}
        message={message}
        loading={mutation.isPending}
        onSubmit={submit}
      />
    </Modal>
  );
}

function PenggunaFormFields({
  form,
  message,
  loading,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<typeof PenggunaSchema>>;
  message: string;
  loading: boolean;
  onSubmit: (input: PenggunaInput) => Promise<void>;
}) {
  const close = useModalClose();
  const username = useField(form, { path: ["username"] });
  const password = useField(form, { path: ["password"] });
  return (
    <Form
      of={form}
      onSubmit={onSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModalBody className="space-y-4">
        <TextField
          field={username}
          label="Username kasir"
          required
          autoComplete="username"
        />
        <PasswordField
          field={password}
          label="Password"
          required
          showStrength
          username={typeof username.input === "string" ? username.input : ""}
        />
        <FormAlert message={message} />
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={close}
        >
          Batal
        </button>
        <FormSubmitButton loading={loading}>Buat akun kasir</FormSubmitButton>
      </ModalFooter>
    </Form>
  );
}
