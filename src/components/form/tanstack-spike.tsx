import type { ReactNode } from "react";

import {
  createFormHook,
  createFormHookContexts,
  useSelector,
} from "@tanstack/react-form";

import { FormSubmitButton as BaseFormSubmitButton } from "./index";

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

type FieldProps = {
  label: string;
  required?: boolean;
  type?: "text" | "password";
  autoComplete?: string;
  placeholder?: string;
};

/** Satu tempat untuk mengubah error Valibot berbentuk teks atau objek menjadi pesan layar. */
function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  const field = useFieldContext<unknown>();
  const errors = useSelector(field.store, (state) => state.meta.errors);
  const message = errors
    .map((error) => {
      if (typeof error === "string") return error;
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      )
        return error.message;
      return "";
    })
    .find(Boolean);
  const id = `uji-${String(field.name).replaceAll(".", "-")}`;

  return (
    <fieldset className="fieldset min-w-0">
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="fieldset-legend"
      >
        {label}
        {required ? " *" : ""}
      </label>
      {children}
      <p
        id={`${id}-error`}
        role={message ? "alert" : undefined}
        className={`validator-hint ${message ? "mt-0! block! visible! text-error wrap-anywhere" : "hidden"}`}
      >
        {message}
      </p>
    </fieldset>
  );
}

function TextField({
  label,
  required,
  type = "text",
  autoComplete,
  placeholder,
}: FieldProps) {
  const field = useFieldContext<string>();
  const hasError = useSelector(
    field.store,
    (state) => state.meta.errors.length > 0,
  );
  const id = `uji-${String(field.name).replaceAll(".", "-")}`;

  return (
    <FormField
      label={label}
      required={required}
    >
      <input
        id={id}
        name={String(field.name)}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-required={required}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-labelledby={`${id}-label`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`input validator w-full ${hasError ? "input-error" : ""}`}
      />
    </FormField>
  );
}

function ContextFormSubmitButton({
  children,
  loading = false,
  disabled = false,
}: {
  children?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  const form = useFormContext();
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <BaseFormSubmitButton
      loading={loading || isSubmitting}
      disabled={disabled || isSubmitting}
    >
      {children}
    </BaseFormSubmitButton>
  );
}

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { FormSubmitButton: ContextFormSubmitButton },
});
