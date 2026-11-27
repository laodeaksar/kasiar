import type { FieldElementProps } from "@formisch/react";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

import { formatRupiah } from "../../lib/format";
import { getPasswordAssessment, getPasswordSuggestion } from "../../lib/password-strength";
import { PasswordRequirementsPopover } from "./password-requirements-popover";

type FormFieldStore = {
  path: readonly PropertyKey[];
  input: unknown;
  errors: [string, ...string[]] | null;
  isTouched: boolean;
  onChange(value: unknown): void;
  props: FieldElementProps;
};
type FieldProps = {
  field: FormFieldStore;
  label: string;
  hint?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  showStrength?: boolean;
  username?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email";
  autoComplete?: string;
};
function errorText(field: FormFieldStore) {
  return field.isTouched ? (field.errors?.[0] ?? "") : "";
}

function useValidity<T extends HTMLInputElement | HTMLSelectElement>(message: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.setCustomValidity(message);
  }, [message]);
  return ref;
}

export function FieldShell({
  label,
  labelId,
  hint,
  hintId,
  message,
  errorId,
  children,
}: {
  label?: string;
  labelId?: string;
  hint?: string;
  hintId?: string;
  message: string;
  errorId?: string;
  children: ReactNode;
}) {
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

export function FormField({
  field,
  label,
  hint,
  required,
  children,
}: FieldProps & { children: ReactNode }) {
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

type InputExtra = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur" | "name" | "id"
>;

export function TextField({
  label,
  field,
  hint,
  icon,
  trailing,
  displayValue,
  parseValue,
  className,
  ...rest
}: {
  label: string;
  field: FormFieldStore;
  hint?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  displayValue?: string;
  parseValue?: (value: string) => unknown;
} & InputExtra) {
  const message = errorText(field);
  const ref = useValidity<HTMLInputElement>(message);
  const attr = ids(field, hint);
  const wrapped = !!(icon || trailing);
  const describedBy =
    [attr.describedBy, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const input = (
    <input
      {...rest}
      {...field.props}
      ref={ref}
      id={attr.id}
      aria-labelledby={attr.labelId}
      value={displayValue ?? String(field.input ?? "")}
      onBlur={field.props.onBlur}
      onChange={(event) =>
        field.onChange(parseValue ? parseValue(event.target.value) : event.target.value)
      }
      aria-invalid={!!message}
      aria-describedby={describedBy}
      className={
        wrapped
          ? `grow ${className ?? ""}`.trim()
          : `${className ?? "input validator w-full"} ${message ? "input-error" : ""}`.trim()
      }
    />
  );
  return (
    <FieldShell
      label={`${label}${rest.required ? " *" : ""}`}
      labelId={attr.labelId}
      hint={hint}
      hintId={attr.hintId}
      message={message}
      errorId={attr.errorId}
    >
      {wrapped ? (
        <label className={`input validator w-full ${message ? "input-error" : ""}`}>
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

export function PasswordStrengthIndicator({
  password,
  username,
}: {
  password: string;
  username?: string;
}) {
  const strength = getPasswordAssessment(password, username).strength;
  const active = strength === "Lemah" ? 1 : strength === "Sedang" ? 2 : 3;
  return (
    <div className="space-y-1">
      <div
        className="flex gap-1"
        aria-hidden="true"
      >
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`h-2 flex-1 rounded-full ${segment <= active ? (strength === "Lemah" ? "bg-error" : strength === "Sedang" ? "bg-warning" : "bg-success") : "bg-base-300"}`}
          />
        ))}
      </div>
      <p
        className="text-sm"
        aria-live="polite"
      >
        Kekuatan password: <strong>{strength}</strong>. {getPasswordSuggestion(strength)}
      </p>
    </div>
  );
}

export function PasswordField(props: FieldProps & InputExtra) {
  const { field, showStrength, username, ...textProps } = props;
  const [visible, setVisible] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const attr = ids(field, props.hint);
  const password = typeof field.input === "string" ? field.input : "";
  const requirementsId = `${attr.id}-requirements`;
  const describedBy =
    [
      attr.describedBy,
      props.hint ? `${attr.id}-hint` : undefined,
      showStrength ? requirementsId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
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
        autoComplete="new-password"
        aria-describedby={describedBy}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            className="btn btn-circle btn-ghost btn-xs"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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

export function NumberField({
  field,
  label,
  decimals = 0,
  hint,
  required,
}: FieldProps & { decimals?: 0 | 1 }) {
  return (
    <TextField
      field={field}
      label={label}
      hint={hint}
      required={required}
      type="number"
      step={decimals === 1 ? "0.1" : "1"}
      inputMode={decimals === 1 ? "decimal" : "numeric"}
      parseValue={(value) => (value === "" ? undefined : Number(value))}
      className="input input-bordered min-h-12 w-full"
    />
  );
}

export function RupiahField({ field, label, hint, required }: FieldProps) {
  const raw =
    typeof field.input === "number"
      ? field.input
      : typeof field.input === "string"
        ? Number(field.input)
        : 0;
  const display = Number.isFinite(raw) && raw > 0 ? formatRupiah(raw).replace(/^Rp\s?/, "") : "";
  return (
    <TextField
      field={field}
      label={label}
      hint={hint}
      required={required}
      type="text"
      inputMode="numeric"
      displayValue={display}
      parseValue={(value) => {
        const digits = value.replace(/\D/g, "");
        return digits === "" ? "" : Number(digits);
      }}
      icon={
        <span
          className="text-base-content/60"
          aria-hidden="true"
        >
          Rp
        </span>
      }
      className="min-h-12 w-full"
    />
  );
}

export function SelectField({
  field,
  label,
  hint,
  required,
  options = [],
}: FieldProps & { options: { label: string; value: string }[] }) {
  const message = errorText(field);
  const ref = useValidity<HTMLSelectElement>(message);
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

export function CheckboxField({
  field,
  label,
  hint,
  required,
  ...rest
}: FieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "checked" | "onChange" | "onBlur" | "name" | "id" | "type"
  >) {
  const message = errorText(field);
  const ref = useValidity<HTMLInputElement>(message);
  const attr = ids(field, hint);
  return (
    <FieldShell
      hint={hint}
      hintId={attr.hintId}
      message={message}
      errorId={attr.errorId}
    >
      <label className="label min-h-12 cursor-pointer justify-start gap-3 px-0">
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
        <span className="label-text">
          {label}
          {required ? " *" : ""}
        </span>
      </label>
    </FieldShell>
  );
}

export function DateField({ field, label, hint, required }: FieldProps) {
  return (
    <TextField
      field={field}
      label={label}
      hint={hint}
      required={required}
      type="date"
      className="input input-bordered min-h-12 w-full"
    />
  );
}
