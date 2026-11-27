import { Form, useField, useForm } from "@formisch/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { TextField, PasswordField, FormAlert, FormSubmitButton } from "~/components/form";
import { PageHeader } from "~/components/page-header";
import { toast } from "~/components/toast";
import { authClient } from "~/lib/auth-client";
import { LoginSchema } from "~/validation/login";
import { parseLoginSearch, safeReturnTarget } from "~/validation/search";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => parseLoginSearch(search),
  beforeLoad: ({ context, search }) => {
    if (context.session) throw redirect({ to: safeReturnTarget(search.kembali) });
  },
  component: LoginPage,
});

function LoginPage() {
  const { kembali, sesiBerakhir } = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (sesiBerakhir !== "1") return;
    toast.warning("Sesi Anda berakhir. Silakan masuk kembali.");
    void navigate({ to: "/login", search: { kembali: safeReturnTarget(kembali) }, replace: true });
  }, [kembali, navigate, sesiBerakhir]);

  const form = useForm({ schema: LoginSchema, initialInput: { username: "", password: "" } });
  const username = useField(form, { path: ["username"] });
  const password = useField(form, { path: ["password"] });

  async function submit(input: { username: string; password: string }) {
    setMessage("");
    try {
      const result = await authClient.signIn.username({
        username: input.username,
        password: input.password,
      });
      if (result.error) throw new Error(result.error.message);
      queryClient.clear();
      await router.invalidate();
      toast.success("Berhasil masuk.");
      await navigate({ to: safeReturnTarget(kembali) });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? "Username atau password salah. Silakan coba lagi."
          : "Tidak dapat masuk. Silakan coba lagi.",
      );
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-base-200 p-4">
      <section className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body gap-5">
          <div>
            <p className="badge badge-primary badge-outline">Kasiar</p>
            <PageHeader
              className="mt-3"
              title="Masuk"
              description="Masuk untuk melanjutkan ke pencatatan toko."
            />
          </div>
          <Form
            of={form}
            onSubmit={submit}
            className="space-y-4"
          >
            <TextField
              field={username}
              label="Username"
              required
            />
            <PasswordField
              field={password}
              label="Password"
              required
            />
            <FormAlert message={message} />
            <FormSubmitButton loading={form.isSubmitting}>Masuk</FormSubmitButton>
          </Form>
        </div>
      </section>
    </main>
  );
}
