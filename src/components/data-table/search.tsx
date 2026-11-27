import { useEffect, useState } from "react";

export function DataTableSearch({
  value,
  onChange,
  label = "Cari",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <DataTableSearchInput
      key={value}
      value={value}
      onChange={onChange}
      label={label}
    />
  );
}

function DataTableSearchInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, value, onChange]);
  return (
    <label className="form-control w-full max-w-md">
      <span className="label-text mb-1">{label}</span>
      <input
        className="input input-bordered min-h-12"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Ketik untuk mencari..."
      />
    </label>
  );
}
