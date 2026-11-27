import {
  keepPreviousData,
  mutationOptions,
  queryOptions,
} from "@tanstack/react-query";
import * as v from "valibot";

import type { ListResponse } from "~/types/api";

import { apiFetch } from "~/lib/api";
import {
  BarangMasukSchema,
  type BarangMasukInput,
} from "~/validation/barang-masuk";

import { barangKeys } from "../barang/queries";

const BarangMasukRowSchema = v.object({
  id: v.string(),
  tanggal: v.string(),
  waktuDicatat: v.string(),
  namaBarang: v.string(),
  satuan: v.string(),
  jumlahPersepuluh: v.number(),
  hargaBeli: v.number(),
  pemasok: v.nullable(v.string()),
  namaPengguna: v.string(),
});
const ListSchema = v.object({
  rows: v.array(BarangMasukRowSchema),
  total: v.number(),
  page: v.number(),
  pageSize: v.number(),
});
const PilihanSchema = v.array(
  v.object({
    id: v.number(),
    nama: v.string(),
    satuan: v.string(),
    hargaJual: v.number(),
  }),
);
const SavedSchema = v.object({
  id: v.string(),
  hargaJual: v.number(),
});
export type BarangMasukRow = v.InferOutput<typeof BarangMasukRowSchema>;
export type PilihanBarang = v.InferOutput<typeof PilihanSchema>[number];
export type BarangMasukParams = {
  q: string;
  dari: string;
  sampai: string;
  halaman: number;
};
export type SimpanBarangMasukInput = {
  input: BarangMasukInput;
  hargaJualDikonfirmasi?: number;
};

export const barangMasukKeys = {
  all: ["barang-masuk"] as const,
  lists: () => [...barangMasukKeys.all, "daftar"] as const,
  list: (params: BarangMasukParams) =>
    [...barangMasukKeys.lists(), params] as const,
  barang: () => [...barangMasukKeys.all, "pilihan-barang"] as const,
  barangSearch: (q: string) => [...barangMasukKeys.barang(), { q }] as const,
  details: () => [...barangMasukKeys.all, "rincian"] as const,
  detail: (id: string | null) => [...barangMasukKeys.details(), id] as const,
};

function decodeList(value: unknown): ListResponse<BarangMasukRow> {
  return v.parse(ListSchema, value);
}
function decodePilihan(value: unknown): PilihanBarang[] {
  return v.parse(PilihanSchema, value);
}
function decodeSaved(value: unknown): {
  id: string;
  hargaJual: number;
} {
  return v.parse(SavedSchema, value);
}

export function getBarangMasuk(params: BarangMasukParams) {
  const query = new URLSearchParams({
    q: params.q,
    dari: params.dari,
    sampai: params.sampai,
    halaman: String(params.halaman),
  });
  return apiFetch<ListResponse<BarangMasukRow>>(
    `/api/barang-masuk?${query}`,
    decodeList,
  );
}

export function barangMasukListOptions(params: BarangMasukParams) {
  return queryOptions({
    queryKey: barangMasukKeys.list(params),
    queryFn: () => getBarangMasuk(params),
    placeholderData: keepPreviousData,
  });
}

export function getPilihanBarang(q: string) {
  return apiFetch<PilihanBarang[]>(
    `/api/barang-masuk/barang?${new URLSearchParams({ q })}`,
    decodePilihan,
  );
}

export function pilihanBarangOptions(q: string, enabled = true) {
  return queryOptions({
    queryKey: barangMasukKeys.barangSearch(q),
    queryFn: () => getPilihanBarang(q),
    enabled,
  });
}

export function simpanBarangMasuk(
  input: unknown,
  hargaJualDikonfirmasi?: number,
) {
  const valid = v.parse(BarangMasukSchema, input);
  return apiFetch("/api/barang-masuk", decodeSaved, {
    method: "POST",
    body: JSON.stringify({
      ...valid,
      ...(hargaJualDikonfirmasi === undefined ? {} : { hargaJualDikonfirmasi }),
    }),
  });
}

export const simpanBarangMasukMutationOptions = () =>
  mutationOptions({
    mutationKey: [...barangMasukKeys.all, "mutasi", "simpan"] as const,
    mutationFn: ({ input, hargaJualDikonfirmasi }: SimpanBarangMasukInput) =>
      simpanBarangMasuk(input, hargaJualDikonfirmasi),
    meta: { errorHandledByForm: true },
    onSuccess: async (_data, _variables, _result, { client }) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: barangKeys.all,
        }),
        client.invalidateQueries({
          queryKey: barangMasukKeys.all,
        }),
      ]);
    },
  });
