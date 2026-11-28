import type { CSSProperties, KeyboardEvent, ReactNode, Ref } from "react";

import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { FormFieldStore } from "~/components/form/utils";

import { FormField } from "~/components/form";
import { errorText, ids, useFieldRef } from "~/components/form/utils";

import type { PilihanBarang } from "../barang-masuk/queries";

import { pilihanBarangOptions } from "../barang-masuk/queries";

type Props = {
  field: FormFieldStore;
  selected: PilihanBarang | null;
  onSelected: (item: PilihanBarang | null) => void;
  inputRef?: Ref<HTMLInputElement>;
  label?: string;
  hint?: string;
};

const NO_OPTIONS: PilihanBarang[] = [];

const noopSubscribe = () => () => {};
function supportsAnchoredPopover() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("position-area", "bottom") &&
    typeof HTMLElement !== "undefined" &&
    "showPopover" in HTMLElement.prototype
  );
}

const panelBase =
  "max-h-[min(16rem,50dvh)] overflow-y-auto overscroll-contain rounded-box border border-base-300 bg-base-100 p-0 text-base-content shadow-lg";
// Popover API + anchor positioning: tampil di top layer (tidak terpotong Modal),
// default di bawah input dan otomatis berbalik ke atas jika ruang kurang.
const panelAnchored = `mx-0 my-1 w-[anchor-size(width)] max-w-[calc(100vw-2rem)] [position-area:bottom_span-right] [position-try-fallbacks:flip-block] ${panelBase}`;
// Fallback untuk browser tanpa anchor positioning / Popover API.
const panelFallback = `absolute inset-x-0 top-full z-20 mt-1 ${panelBase}`;

/**
 * Field pilih barang dengan pencarian ke server (combobox).
 * Nilai field berupa id barang (number; 0 jika belum dipilih), sedangkan objek barang yang
 * dipilih disimpan oleh pemanggil lewat `selected` / `onSelected`.
 * Keyboard: ArrowDown/ArrowUp pindah pilihan, Enter memilih, Escape menutup daftar.
 *
 * @example
 * const [barang, setBarang] = useState<PilihanBarang | null>(null);
 * <Field of={form} path={["barangId"]}>
 *   {(field) => (
 *     <BarangSelectField field={field} selected={barang} onSelected={setBarang} />
 *   )}
 * </Field>
 */
export function BarangSelectField({
  field,
  selected,
  onSelected,
  inputRef,
  label = "Barang",
  hint,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const anchored = useSyncExternalStore(
    noopSubscribe,
    supportsAnchoredPopover,
    () => false,
  );
  const {
    data: options = NO_OPTIONS,
    isPending,
    isError,
  } = useQuery(pilihanBarangOptions(query, open));

  const message = errorText(field);
  const ref = useFieldRef<HTMLInputElement>(field, message, inputRef);
  // Info harga menggantikan hint saat barang sudah dipilih dan daftar tertutup.
  const info =
    selected && !open
      ? `Harga jual saat ini: Rp ${selected.hargaJual.toLocaleString("id-ID")}`
      : hint;
  const attr = ids(field, info);
  const listId = `${attr.id}-list`;
  const anchorName = `--${attr.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const optionId = (item: PilihanBarang) => `${attr.id}-opsi-${item.id}`;

  const showList = !isPending && !isError;
  const active =
    open && showList && options.length > 0
      ? Math.min(activeIndex, options.length - 1)
      : -1;
  const activeItem = active >= 0 ? options[active] : undefined;
  const activeId = activeItem ? optionId(activeItem) : undefined;

  // Jaga opsi aktif tetap terlihat saat navigasi keyboard.
  useEffect(() => {
    if (activeId)
      document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function openList() {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }
  function choose(item: PilihanBarang) {
    field.onChange(item.id);
    onSelected(item);
    setQuery("");
    setOpen(false);
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = options.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else if (count > 0)
          setActiveIndex((Math.min(activeIndex, count - 1) + 1) % count);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else if (count > 0)
          setActiveIndex(
            (Math.min(activeIndex, count - 1) - 1 + count) % count,
          );
        break;
      case "Enter":
        if (activeItem) {
          event.preventDefault();
          choose(activeItem);
        }
        break;
      case "Escape":
        if (open) {
          // Tutup daftar saja; jangan ikut menutup Modal di belakangnya.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        break;
    }
  }

  return (
    <FormField
      field={field}
      label={label}
      hint={info}
      required
    >
      <div
        className="relative w-full"
        style={anchored ? ({ anchorName } as CSSProperties) : undefined}
        onFocus={() => {
          if (!open) openList();
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setOpen(false);
        }}
      >
        <label
          className={`input validator w-full ${message ? "input-error" : ""}`}
        >
          <Search
            className="size-4 shrink-0 opacity-60"
            aria-hidden="true"
          />
          <input
            {...field.props}
            ref={ref}
            id={attr.id}
            type="search"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-labelledby={attr.labelId}
            aria-invalid={Boolean(message)}
            aria-describedby={attr.describedBy}
            className="min-w-0 grow"
            value={open ? query : (selected?.nama ?? "")}
            placeholder="Cari nama barang..."
            onClick={() => {
              if (!open) openList();
            }}
            onKeyDown={onKeyDown}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
              field.onChange(0);
              onSelected(null);
            }}
          />
        </label>
        {open && (
          <ResultsPanel
            anchored={anchored}
            anchorName={anchorName}
          >
            {isPending && (
              <p
                className="p-3 text-sm"
                role="status"
              >
                Mencari barang...
              </p>
            )}
            {isError && (
              <p
                className="p-3 text-sm text-error"
                role="alert"
              >
                Barang gagal dimuat. Coba lagi.
              </p>
            )}
            {showList && options.length === 0 && (
              <p
                className="p-3 text-sm"
                role="status"
              >
                Barang tidak ditemukan.
              </p>
            )}
            {showList && (
              <ul
                id={listId}
                role="listbox"
                aria-label={label}
                className="py-1"
              >
                {options.map((item, index) => {
                  const isSelected = selected?.id === item.id;
                  return (
                    <li
                      key={item.id}
                      id={optionId(item)}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 hover:bg-base-200 ${index === active ? "bg-base-200" : ""}`}
                      // Cegah input kehilangan fokus (dan daftar tertutup) saat opsi diketuk.
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(item)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Check
                          className={`size-4 shrink-0 ${isSelected ? "" : "invisible"}`}
                          aria-hidden="true"
                        />
                        <span className="wrap-anywhere">{item.nama}</span>
                      </span>
                      <span className="shrink-0 text-sm text-base-content/70">
                        {item.satuan}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </ResultsPanel>
        )}
      </div>
    </FormField>
  );
}

/** Panel hasil: popover "manual" di top layer jika didukung, selain itu absolute biasa. */
function ResultsPanel({
  anchored,
  anchorName,
  children,
}: {
  anchored: boolean;
  anchorName: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = panelRef.current;
    if (anchored && panel && !panel.matches(":popover-open"))
      panel.showPopover();
  }, [anchored]);
  return (
    <div
      ref={panelRef}
      popover={anchored ? "manual" : undefined}
      style={
        anchored ? ({ positionAnchor: anchorName } as CSSProperties) : undefined
      }
      className={anchored ? panelAnchored : panelFallback}
    >
      {children}
    </div>
  );
}
