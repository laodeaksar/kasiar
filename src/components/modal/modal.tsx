import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  locked = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Selama true, Esc dan klik latar tidak menutup dialog (mis. impor berjalan). */
  locked?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal modal-bottom sm:modal-middle no-print"
      onCancel={(event) => {
        if (locked) event.preventDefault();
      }}
      onClose={() => {
        // Klik latar menutup tanpa event cancel: buka lagi bila terkunci.
        if (locked) {
          if (ref.current && !ref.current.open) ref.current.showModal();
        } else onClose();
      }}
    >
      <div className="modal-box w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>
        {/* Anak dipasang hanya saat terbuka agar form selalu mulai dari nilai awal. */}
        {open ? children : null}
      </div>
      <form
        method="dialog"
        className="modal-backdrop"
      >
        <button type="submit">Tutup</button>
      </form>
    </dialog>
  );
}

export function ModalBody({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={`min-h-0 overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function ModalFooter({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"footer">) {
  return (
    <footer
      {...props}
      className={`flex flex-wrap justify-end gap-2 ${className}`}
    >
      {children}
    </footer>
  );
}
