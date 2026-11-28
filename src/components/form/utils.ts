import type { FieldElementProps } from "@formisch/react";
import type { Ref } from "react";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";

/** Bentuk minimal store field formisch yang dipakai komponen form. */
export type FormFieldStore = {
  path: readonly PropertyKey[];
  input: unknown;
  errors: [string, ...string[]] | null;
  isTouched: boolean;
  onChange(value: unknown): void;
  props: FieldElementProps;
};

/**
 * Mengambil pesan error pertama untuk ditampilkan. Mengembalikan "" jika tidak ada error.
 *
 * Tidak memfilter dengan `isTouched`: formisch menandai field "touched" saat difokus dan
 * tidak menandai field yang belum disentuh saat submit, sehingga filter itu akan
 * menyembunyikan error field yang kosong setelah tombol submit ditekan. Dengan konfigurasi
 * bawaan (`validate: "submit"`), error baru ada setelah submit pertama.
 */
export function errorText(field: FormFieldStore) {
  return field.errors?.[0] ?? "";
}

/**
 * Membuat id yang konsisten dari path field: id input, label, hint, dan error, plus
 * `describedBy` untuk aria-describedby (error lebih diutamakan daripada hint).
 *
 * @example
 * const attr = ids(field, "Contoh hint");
 * <input id={attr.id} aria-labelledby={attr.labelId} aria-describedby={attr.describedBy} />
 */
export function ids(field: FormFieldStore, hint?: string) {
  const id = `field-${field.path.map(String).join("-")}`;
  const message = errorText(field);
  return {
    id,
    labelId: `${id}-label`,
    hintId: hint ? `${id}-hint` : undefined,
    errorId: message ? `${id}-error` : undefined,
    describedBy: message ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

/**
 * Hook untuk elemen <input>/<select> milik field.
 * Menggabungkan ref formisch (agar field terdaftar, mis. untuk fokus otomatis ke field
 * error saat submit) dengan ref lokal untuk setCustomValidity (agar validasi native/
 * pseudo-class :user-invalid mengikuti pesan error formisch). `forwardedRef` opsional
 * meneruskan elemen ke ref dari luar (mis. untuk memanggil focus()).
 *
 * @example
 * const message = errorText(field);
 * const ref = useFieldRef<HTMLInputElement>(field, message, inputRef);
 * return <input {...field.props} ref={ref} />; // ref harus SETELAH spread field.props
 */
export function useFieldRef<T extends HTMLInputElement | HTMLSelectElement>(
  field: FormFieldStore,
  message: string,
  forwardedRef?: Ref<T>,
) {
  const elementRef = useRef<T | null>(null);
  const formRef = field.props.ref;
  const ref = useCallback(
    (element: T | null) => {
      elementRef.current = element;
      if (element) formRef(element);
    },
    [formRef],
  );
  useImperativeHandle(forwardedRef, () => elementRef.current as T, []);
  useEffect(() => {
    elementRef.current?.setCustomValidity(message);
  }, [message]);
  return ref;
}
