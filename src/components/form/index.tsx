import type { ReactNode } from "react";
export {
  FieldShell,
  FormField,
  TextField,
  PasswordField,
  NumberField,
  RupiahField,
  SelectField,
  CheckboxField,
  DateField,
} from "./fields";
export {
  PasswordRequirementsPopover,
  PasswordStrengthIndicator,
} from "./password-requirements";

export function FormSubmitButton({
  children = "Simpan",
  loading = false,
  disabled = false,
}: {
  children?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && (
        <span
          className="loading loading-spinner loading-sm"
          aria-hidden="true"
        />
      )}
      {loading ? "Menyimpan..." : children}
    </button>
  );
}

export function FormAlert({
  message,
  children,
}: {
  message?: string;
  children?: ReactNode;
}) {
  if (!message && !children) return null;
  return (
    <div
      className="alert alert-error"
      role="alert"
    >
      {message ?? children}
    </div>
  );
}
