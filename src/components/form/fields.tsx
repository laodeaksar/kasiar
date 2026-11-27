import type { FieldElementProps } from "@formisch/react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatRupiah } from "~/lib/format";

import {
  PasswordRequirementsPopover,
  PasswordStrengthIndicator,
} from "./password-requirements";

type FormFieldStore = {
  path: readonly PropertyKey[];
  input: unknown;
  errors: [string, ...string[]] | null;
  isTouched: boolean;
  onChange(value: unknown): void;
  props: FieldElementProps;
};
/** Props dasar yang dimiliki semua field. */
type BaseFieldProps = {
  field: FormFieldStore;
  label: string;
  hint?: string;
  required?: boolean;
};

/** Atribut <input> yang dikelola komponen/formisch dan tidak boleh diatur dari luar. */
type ManagedInputKeys =
  | "value"
  | "defaultValue"
  | "checked"
  | "defaultChecked"
  | "onChange"
  | "onBlur"
  | "name"
  | "id"
  | "required";
type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  ManagedInputKeys
>;

/** Field teks generik: semua atribut <input> native + opsi tampilan/parsing. */
type TextFieldProps = BaseFieldProps &
  NativeInputProps & {
    icon?: ReactNode;
    trailing?: ReactNode;
    displayValue?: string;
    parseValue?: (value: string) => unknown;
  };
type PasswordFieldProps = BaseFieldProps &
  Omit<NativeInputProps, "type"> & {
    showStrength?: boolean;
    username?: string;
  };
/** Field berjenis tetap (angka, rupiah, tanggal): hanya props dasar + sedikit atribut native. */
type SimpleFieldProps = BaseFieldProps &
  Pick<NativeInputProps, "placeholder" | "disabled">;
type NumberFieldProps = SimpleFieldProps & {
  decimals?: 0 | 1;
};
type SelectOption = { label: string; value: string };
type SelectFieldProps = BaseFieldProps & {
  options: readonly SelectOption[];
};
type CheckboxFieldProps = BaseFieldProps & Omit<NativeInputProps, "type">;
type FormFieldProps = BaseFieldProps & {
  children: ReactNode;
};
type FieldShellProps = {
  label?: string;
  labelId?: string;
  hint?: string;
  hintId?: string;
  message: string;
  errorId?: string;
  children: ReactNode;
};

/**
 * Mengambil pesan error pertama untuk ditampilkan, tetapi hanya setelah field disentuh
 * (isTouched), supaya form baru dibuka tidak langsung penuh pesan merah.
 * Mengembalikan "" jika tidak ada error.
 */
function errorText(field: FormFieldStore) {
  return field.isTouched ? (field.errors?.[0] ?? "") : "";
}

/**
 * Hook internal untuk elemen <input>/<select> milik field.
 * Menggabungkan ref formisch (agar field terdaftar, mis. untuk fokus otomatis ke field
 * error saat submit) dengan ref lokal untuk setCustomValidity (agar validasi native/
 * pseudo-class :user-invalid mengikuti pesan error formisch).
 *
 * @example
 * const message = errorText(field);
 * const ref = useFieldRef<HTMLInputElement>(field, message);
 * return <input {...field.props} ref={ref} />; // ref harus SETELAH spread field.props
 */
function useFieldRef<T extends HTMLInputElement | HTMLSelectElement>(
  field: FormFieldStore,
  message: string,
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
  useEffect(() => {
    elementRef.current?.setCustomValidity(message);
  }, [message]);
  return ref;
}

/**
 * Pembungkus tampilan satu field: label (legend), kontrol, pesan error, dan hint.
 * Hint disembunyikan saat ada error. Dipakai oleh semua field di file ini; pakai langsung
 * hanya untuk membuat jenis field baru.
 *
 * @example
 * <FieldShell label="Nama *" labelId="n-label" message={errorText(field)} errorId="n-error">
 *   <input className="input validator w-full" />
 * </FieldShell>
 */
export function FieldShell({
  label,
  labelId,
  hint,
  hintId,
  message,
  errorId,
  children,
}: FieldShellProps) {
  return (
    <fieldset className="fieldset min-w-0">
      {label ? (
        <legend
          id={labelId}
          className="fieldset-legend"
        >
          {label}
        </legend>
      ) : null}
      {children}
      <p
        id={message ? errorId : undefined}
        role={message ? "alert" : undefined}
        className={`validator-hint ${message ? "mt-0! block! visible! text-error wrap-anywhere" : "hidden"}`}
      >
        {message}
      </p>
      {hint && !message ? (
        <p
          id={hintId}
          className="label h-auto max-w-full whitespace-normal wrap-anywhere"
        >
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * Pembungkus field untuk kontrol kustom (radio, textarea, upload, dll.) yang tidak punya
 * komponen sendiri. Menyediakan label, hint, dan pesan error; kontrolnya Anda tulis sendiri.
 * Gunakan `ids(field, hint)` untuk id/aria-describedby kontrol tersebut.
 *
 * @example
 * <FormField field={field} label="Catatan" hint="Opsional">
 *   <textarea {...field.props} className="textarea w-full" />
 * </FormField>
 */
export function FormField({
  field,
  label,
  hint,
  required,
  children,
}: FormFieldProps) {
  const attr = ids(field, hint);
  return (
    <FieldShell
      label={`${label}${required ? " *" : ""}`}
      labelId={attr.labelId}
      hint={hint}
      hintId={attr.hintId}
      message={errorText(field)}
      errorId={attr.errorId}
    >
      {children}
    </FieldShell>
  );
}

/**
 * Membuat id yang konsisten dari path field: id input, label, hint, dan error, plus
 * `describedBy` untuk aria-describedby (error lebih diutamakan daripada hint).
 *
 * @example
 * const attr = ids(field, "Contoh hint");
 * <input id={attr.id} aria-labelledby={attr.labelId} aria-describedby={attr.describedBy} />
 */
function ids(field: FormFieldStore, hint?: string) {
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
 * Field teks generik. Menerima semua atribut <input> native (type, placeholder,
 * autoComplete, inputMode, maxLength, dll.) kecuali yang dikelola formisch.
 * - `icon` / `trailing`: elemen di kiri/kanan dalam kotak input.
 * - `displayValue`: teks yang ditampilkan jika berbeda dari nilai field (mis. format angka).
 * - `parseValue`: ubah teks ketikan menjadi nilai field sebelum disimpan.
 *
 * @example
 * <Field of={form} path={["nama"]}>
 *   {(field) => <TextField field={field} label="Nama barang" required autoComplete="off" />}
 * </Field>
 */
export function TextField({
  label,
  field,
  hint,
  required,
  icon,
  trailing,
  displayValue,
  parseValue,
  className,
  ...rest
}: TextFieldProps) {
  const message = errorText(field);
  const ref = useFieldRef<HTMLInputElement>(field, message);
  const attr = ids(field, hint);
  const wrapped = !!(icon || trailing);
  const describedBy =
    [attr.describedBy, rest["aria-describedby"]].filter(Boolean).join(" ") ||
    undefined;
  const input = (
    <input
      {...rest}
      {...field.props}
      ref={ref}
      id={attr.id}
      required={required}
      aria-labelledby={attr.labelId}
      value={displayValue ?? String(field.input ?? "")}
      onBlur={field.props.onBlur}
      onChange={(event) =>
        field.onChange(
          parseValue ? parseValue(event.target.value) : event.target.value,
        )
      }
      aria-invalid={!!message}
      aria-describedby={describedBy}
      className={
        wrapped
          ? `min-w-0 grow ${className ?? ""}`.trim()
          : `input validator w-full ${message ? "input-error" : ""} ${className ?? ""}`.trim()
      }
    />
  );
  return (
    <FieldShell
      label={`${label}${required ? " *" : ""}`}
      labelId={attr.labelId}
      hint={hint}
      hintId={attr.hintId}
      message={message}
      errorId={attr.errorId}
    >
      {wrapped ? (
        <label
          className={`input validator w-full ${message ? "input-error" : ""}`}
        >
          {icon}
          {input}
          {trailing}
        </label>
      ) : (
        input
      )}
    </FieldShell>
  );
}

/**
 * Field password dengan tombol tampilkan/sembunyikan. Atur `autoComplete` sesuai konteks
 * (default "new-password"; pakai "current-password" untuk form login).
 * Dengan `showStrength`, muncul indikator kekuatan dan popover syarat password saat fokus;
 * isi `username` agar password yang sama dengan username ditolak.
 *
 * @example
 * // Form daftar / ganti password
 * <PasswordField field={field} label="Password" required showStrength username={username} />
 * // Form login
 * <PasswordField field={field} label="Password" required autoComplete="current-password" />
 */
export function PasswordField(props: PasswordFieldProps) {
  const { field, showStrength, username, ...textProps } = props;
  const [visible, setVisible] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const attr = ids(field, props.hint);
  const password = typeof field.input === "string" ? field.input : "";
  const requirementsId = `${attr.id}-requirements`;
  // TextField sudah menambahkan ID error/hint miliknya sendiri; di sini hanya
  // tambahan dari luar dan daftar syarat password.
  const extraDescribedBy =
    [props["aria-describedby"], showStrength ? requirementsId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    )
      return;
    setPopoverOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onFocusCapture={() => {
        if (showStrength) setPopoverOpen(true);
      }}
      onBlurCapture={handleBlur}
    >
      <TextField
        {...textProps}
        field={field}
        type={visible ? "text" : "password"}
        autoComplete={textProps.autoComplete ?? "new-password"}
        aria-describedby={extraDescribedBy}
        trailing={
          <button
            type="button"
            // Cegah tombol mencuri fokus: popover tidak tertutup (Safari/iOS)
            // dan keyboard HP tetap terbuka.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={visible}
            className="btn btn-circle btn-ghost btn-xs"
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        }
      />
      {showStrength && (
        <PasswordStrengthIndicator
          password={password}
          username={username}
        />
      )}
      {showStrength && (
        <PasswordRequirementsPopover
          password={password}
          username={username}
          open={popoverOpen}
          containerRef={containerRef}
          id={requirementsId}
        />
      )}
    </div>
  );
}

/**
 * Field angka (<input type="number">). Nilai field berupa number, atau undefined jika
 * dikosongkan. `decimals={1}` mengizinkan satu angka desimal.
 *
 * @example
 * <NumberField field={field} label="Jumlah" required />
 * <NumberField field={field} label="Berat (kg)" decimals={1} />
 */
export function NumberField({ decimals = 0, ...props }: NumberFieldProps) {
  return (
    <TextField
      {...props}
      type="number"
      step={decimals === 1 ? "0.1" : "1"}
      inputMode={decimals === 1 ? "decimal" : "numeric"}
      parseValue={(value) => (value === "" ? undefined : Number(value))}
    />
  );
}

const MAX_RUPIAH_DIGITS = 12;

/**
 * Field nominal rupiah. Tampilan diformat per ribuan dengan awalan "Rp"; nilai field berupa
 * number (maksimal 12 digit) atau undefined jika kosong. Nilai 0 tetap ditampilkan.
 *
 * @example
 * <RupiahField field={field} label="Harga jual" required hint="Per satuan" />
 */
export function RupiahField(props: SimpleFieldProps) {
  const { field } = props;
  const raw =
    typeof field.input === "number"
      ? field.input
      : typeof field.input === "string" && field.input.trim() !== ""
        ? Number(field.input)
        : undefined;
  // Nilai 0 tetap ditampilkan; hanya kosong/undefined yang menghasilkan teks kosong.
  const display =
    raw !== undefined && Number.isFinite(raw)
      ? formatRupiah(raw).replace(/^Rp\s?/, "")
      : "";
  return (
    <TextField
      {...props}
      type="text"
      inputMode="numeric"
      displayValue={display}
      parseValue={(value) => {
        const digits = value.replace(/\D/g, "").slice(0, MAX_RUPIAH_DIGITS);
        return digits === "" ? undefined : Number(digits);
      }}
      icon={
        <span
          className="text-base-content/60"
          aria-hidden="true"
        >
          Rp
        </span>
      }
    />
  );
}

/**
 * Dropdown pilihan. `options` wajib; nilai field berupa string `value` opsi terpilih.
 * Untuk placeholder, sertakan opsi dengan value "" (mis. "Pilih satuan").
 *
 * @example
 * <SelectField
 *   field={field}
 *   label="Satuan"
 *   required
 *   options={[
 *     { label: "Pilih satuan", value: "" },
 *     { label: "Kg", value: "kg" },
 *     { label: "Liter", value: "liter" },
 *   ]}
 * />
 */
export function SelectField({
  field,
  label,
  hint,
  required,
  options,
}: SelectFieldProps) {
  const message = errorText(field);
  const ref = useFieldRef<HTMLSelectElement>(field, message);
  const attr = ids(field, hint);
  return (
    <FieldShell
      label={`${label}${required ? " *" : ""}`}
      labelId={attr.labelId}
      hint={hint}
      hintId={attr.hintId}
      message={message}
      errorId={attr.errorId}
    >
      <select
        {...field.props}
        ref={ref}
        id={attr.id}
        aria-labelledby={attr.labelId}
        value={String(field.input ?? "")}
        onChange={(event) => field.onChange(event.target.value)}
        className={`select validator w-full ${message ? "select-error" : ""}`}
        required={required}
        aria-invalid={!!message}
        aria-describedby={attr.describedBy}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/**
 * Kotak centang. Nilai field berupa boolean. `label` tampil di samping kotak; `required`
 * menambahkan tanda * dan membuat field wajib dicentang.
 *
 * @example
 * <CheckboxField field={field} label="Saya setuju dengan syarat dan ketentuan" required />
 */
export function CheckboxField({
  field,
  label,
  hint,
  required,
  ...rest
}: CheckboxFieldProps) {
  const message = errorText(field);
  const ref = useFieldRef<HTMLInputElement>(field, message);
  const attr = ids(field, hint);
  return (
    <FieldShell
      hint={hint}
      hintId={attr.hintId}
      message={message}
      errorId={attr.errorId}
    >
      <label className="label cursor-pointer justify-start gap-3 px-0">
        <input
          {...rest}
          {...field.props}
          ref={ref}
          id={attr.id}
          type="checkbox"
          checked={field.input === true}
          onChange={(event) => field.onChange(event.target.checked)}
          required={required}
          aria-invalid={!!message}
          aria-describedby={attr.describedBy}
          className={`checkbox validator ${message ? "checkbox-error" : ""}`}
        />
        <span>
          {label}
          {required ? " *" : ""}
        </span>
      </label>
    </FieldShell>
  );
}

/**
 * Field tanggal (<input type="date">). Nilai field berupa string "YYYY-MM-DD".
 *
 * @example
 * <DateField field={field} label="Tanggal masuk" required />
 */
export function DateField(props: SimpleFieldProps) {
  return (
    <TextField
      {...props}
      type="date"
    />
  );
}
