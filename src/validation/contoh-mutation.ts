import * as v from "valibot";

export const ContohMutationSchema = v.object({
  nama: v.pipe(v.string(), v.minLength(1, "Nama wajib diisi.")),
  simulasi: v.picklist(["sukses", "isian", "umum", "sesi"]),
});

export type ContohMutationInput = v.InferOutput<typeof ContohMutationSchema>;
