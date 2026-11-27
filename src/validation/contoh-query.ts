import * as v from "valibot";

export const ContohQuerySearchSchema = v.object({
  q: v.pipe(v.string(), v.maxLength(100)),
  halaman: v.pipe(v.number(), v.integer(), v.minValue(1)),
  status: v.picklist(["aktif", "nonaktif", "semua"]),
});
export type ContohQuerySearch = v.InferOutput<typeof ContohQuerySearchSchema>;

export function parseContohQuerySearch(value: unknown): ContohQuerySearch {
  return v.parse(ContohQuerySearchSchema, value);
}
