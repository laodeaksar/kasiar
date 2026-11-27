import { Form, useField, useForm } from "@formisch/react";
import * as v from "valibot";

import { PasswordField } from "./fields";

const PasswordDemoSchema = v.object({
  password: v.string(),
});
const passwordExamples = [
  {
    title: "Kolom dekat tepi atas",
    username: "kasir",
    password: "",
    note: "Kosong; gunakan ini untuk mencoba pembalikan posisi di dekat batas atas.",
  },
  {
    title: "Password pendek",
    username: "kasir",
    password: "Ab1!",
    note: "Belum memenuhi panjang minimum.",
  },
  {
    title: "Sama dengan username",
    username: "kasir123",
    password: "kasir123",
    note: "Harus ditolak karena sama dengan username.",
  },
  {
    title: "Delapan karakter, satu jenis",
    username: "kasir",
    password: "abcdefgh",
    note: "Belum memenuhi jumlah jenis karakter wajib.",
  },
  {
    title: "Delapan karakter, dua jenis",
    username: "kasir",
    password: "abcd1234",
    note: "Memenuhi syarat wajib; kekuatan Sedang.",
  },
  {
    title: "Dua belas karakter, tiga jenis",
    username: "kasir",
    password: "Abcdef123456",
    note: "Memenuhi syarat disarankan; kekuatan Kuat.",
  },
];

export function PasswordRequirementsSamples() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold">Uji syarat password</h2>
        <p className="text-sm text-base-content/70">
          Fokuskan kolom untuk membuka kotak. Coba mengetik, pindah fokus, dan
          gunakan tombol tampil/sembunyikan password.
        </p>
        <p className="text-sm text-base-content/70">
          Ubah lebar halaman menjadi HP dan desktop. Gulir kolom pertama hingga
          dekat tepi atas layar untuk memeriksa posisi kotak yang berpindah ke
          bawah.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            className="min-w-0 rounded-box border border-base-300 bg-base-100 p-4 text-base-content sm:p-5"
          >
            <h3 className="mb-3 text-lg font-semibold">
              Tema {theme === "light" ? "terang" : "gelap"}
            </h3>
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2">
              {passwordExamples.map((example) => (
                <PasswordDemo
                  key={`${theme}-${example.title}`}
                  {...example}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PasswordDemo({
  title,
  username,
  password,
  note,
}: {
  title: string;
  username: string;
  password: string;
  note: string;
}) {
  const form = useForm({
    schema: PasswordDemoSchema,
    initialInput: { password },
  });
  const field = useField(form, { path: ["password"] });
  return (
    <div className="min-w-0 rounded-box border border-base-300 p-3">
      <p className="mb-1 font-medium">{title}</p>
      <p className="mb-3 text-xs text-base-content/70">
        Username uji: {username}. {note}
      </p>
      <Form
        of={form}
        onSubmit={() => undefined}
      >
        <PasswordField
          field={field}
          label="Password contoh"
          showStrength
          username={username}
        />
      </Form>
    </div>
  );
}
