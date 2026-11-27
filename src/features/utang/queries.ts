import { keepPreviousData, mutationOptions, queryOptions } from "@tanstack/react-query";
import * as v from "valibot";

import type { ListResponse } from "~/types/api";

import { apiFetch } from "~/lib/api";
import { PelunasanSchema, type PelunasanInput } from "~/validation/pelunasan";

const UtangRowSchema = v.object({
  id: v.number(),
  nama: v.string(),
  sisaUtang: v.number(),
  status: v.picklist(["utang", "lunas"]),
});
const ListSchema = v.object({
  rows: v.array(UtangRowSchema),
  total: v.number(),
  page: v.number(),
  pageSize: v.number(),
});
const TransaksiSchema = v.object({
  id: v.string(),
  waktuDicatat: v.string(),
  total: v.number(),
  jumlahDibayar: v.number(),
  sisaSaatTransaksi: v.number(),
  namaKasir: v.string(),
});
const PembayaranSchema = v.object({
  id: v.number(),
  tanggal: v.string(),
  nominal: v.number(),
  namaPengguna: v.string(),
});
const DetailSchema = v.object({
  id: v.number(),
  nama: v.string(),
  totalUtang: v.number(),
  totalPembayaran: v.number(),
  sisaUtang: v.number(),
  transaksi: v.array(TransaksiSchema),
  pembayaran: v.array(PembayaranSchema),
});
const SavedSchema = v.object({
  id: v.number(),
  pembeliId: v.number(),
  nominal: v.number(),
  sisaUtang: v.number(),
  status: v.picklist(["utang", "lunas"]),
});

export type UtangRow = v.InferOutput<typeof UtangRowSchema>;
export type UtangParams = { q: string; status: "belum-lunas" | "semua"; halaman: number };
export type UtangDetail = v.InferOutput<typeof DetailSchema>;
export type SimpanPelunasan = v.InferInput<typeof PelunasanSchema>;
export const utangKeys = {
  all: ["utang"] as const,
  lists: () => [...utangKeys.all, "daftar"] as const,
  list: (params: UtangParams) => [...utangKeys.lists(), params] as const,
  details: () => [...utangKeys.all, "rincian"] as const,
  detail: (id: number | undefined) => [...utangKeys.details(), id] as const,
};

export function utangListOptions(params: UtangParams) {
  const query = new URLSearchParams({
    q: params.q,
    status: params.status,
    halaman: String(params.halaman),
  });
  return queryOptions({
    queryKey: utangKeys.list(params),
    queryFn: () =>
      apiFetch<ListResponse<UtangRow>>(`/api/utang?${query}`, (value) =>
        v.parse(ListSchema, value),
      ),
    placeholderData: keepPreviousData,
  });
}
export function utangDetailOptions(id?: number) {
  return queryOptions({
    queryKey: utangKeys.detail(id),
    queryFn: () =>
      apiFetch<UtangDetail>(`/api/utang/${id}`, (value) => v.parse(DetailSchema, value)),
    enabled: id !== undefined,
  });
}
export function simpanPelunasan(input: SimpanPelunasan) {
  const valid = v.parse(PelunasanSchema, input);
  return apiFetch("/api/utang/pelunasan", (value) => v.parse(SavedSchema, value), {
    method: "POST",
    body: JSON.stringify(valid),
  });
}
export const simpanPelunasanMutationOptions = () =>
  mutationOptions({
    mutationKey: [...utangKeys.all, "pelunasan"] as const,
    mutationFn: (input: PelunasanInput) => simpanPelunasan(input),
    meta: { errorHandledByForm: true },
    onSuccess: async (_data, _variables, _result, { client }) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: utangKeys.all }),
        client.invalidateQueries({ queryKey: ["pembeli"] }),
      ]);
    },
  });
