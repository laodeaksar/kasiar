import * as v from "valibot";

import { getPasswordAssessment } from "~/lib/password-strength";

export const PenggunaSchema = v.pipe(
  v.object({
    username: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(3, "Username minimal 3 karakter."),
      v.maxLength(30, "Username maksimal 30 karakter."),
      v.regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username hanya boleh berisi huruf, angka, titik, dan garis bawah.",
      ),
    ),
    password: v.pipe(
      v.string(),
      v.maxLength(128, "Password maksimal 128 karakter."),
    ),
  }),
  v.forward(
    v.check(
      ({ username, password }) =>
        getPasswordAssessment(password, username).valid,
      "Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol.",
    ),
    ["password"],
  ),
);
export type PenggunaInput = v.InferInput<typeof PenggunaSchema>;
