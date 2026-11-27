import { Search } from "lucide-react";
import { useEffect, useState } from "react";

type DataTableSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DataTableSearch({ value, onChange }: DataTableSearchProps) {
  const [draft, setDraft] = useState(value);
  
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <label className="input input-sm w-full max-w-xs">
      <Search className="size-4 opacity-50" />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Ketik untuk mencari..."
      />
    </label>
  );
}
