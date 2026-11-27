import { mutationOptions, queryOptions } from "@tanstack/react-query";
import * as v from "valibot";

import { apiFetch } from "~/lib/api";
import { TransaksiSchema, type TransaksiInput } from "~/validation/transaksi";

import { barangKeys } from "../barang/queries";

const PembeliSchema = v.array(v.object({ id: v.number(), nama: v.string() }));
const SavedSchema = v.object({
  id: v.string(),
  status: v.picklist(["lunas", "utang"]),
  total: v.number(),
  jumlahDibayar: v.number(),
  sisaUtang: v.number(),
  namaPembeli: v.nullable(v.string()),
});
export const pembeliKeys = {
  all: ["pembeli"] as const,
  search: (q: string) => [...pembeliKeys.all, q] as const,
};
export const transaksiKeys = { all: ["transaksi"] as const };
function decodePembeli(value: unknown) {
  return v.parse(PembeliSchema, value);
}
function decodeSaved(value: unknown) {
  return v.parse(SavedSchema, value);
}
export function pembeliOptions(q: string, enabled = true) {
  return queryOptions({
    queryKey: pembeliKeys.search(q),
    queryFn: () => apiFetch(`/api/transaksi/pembeli?q=${encodeURIComponent(q)}`, decodePembeli),
    enabled,
  });
}
export function simpanTransaksi(input: TransaksiInput) {
  const valid = v.parse(TransaksiSchema, input);
  return apiFetch("/api/transaksi", decodeSaved, { method: "POST", body: JSON.stringify(valid) });
}
export const simpanTransaksiMutationOptions = () =>
  mutationOptions({
    mutationKey: [...transaksiKeys.all, "simpan"] as const,
    mutationFn: simpanTransaksi,
    meta: { errorHandledByForm: true },
    onSuccess: async (_data, _variables, _result, { client }) =>
      Promise.all([
        client.invalidateQueries({ queryKey: barangKeys.all }),
        client.invalidateQueries({ queryKey: pembeliKeys.all }),
        client.invalidateQueries({ queryKey: ["utang"] }),
      ]),
  });
