import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
} from "react";

type ModalProps = {
  title: string;
  descriptionId?: string;
  placement?: "bawah" | "tengah";
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Selama true, Esc dan klik latar tidak menutup dialog (mis. impor berjalan). */
  locked?: boolean;
};

export function Modal({
  title,
  descriptionId,
  placement = "bawah",
  open,
  onClose,
  children,
  locked = false,
}: ModalProps) {
  const reactId = useId();
  const titleId = `modal-title-${reactId.replaceAll(":", "")}`;

  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const dialogPlacement =
    placement === "tengah" ? "modal-middle" : "modal-bottom sm:modal-middle";

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${dialogPlacement} kasiar-modal no-print`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(e) => {
        if (locked) e.preventDefault();
      }}
      onClose={() => {
        // Klik latar menutup tanpa event cancel: buka lagi bila terkunci
        if (locked) {
          if (ref.current && !ref.current.open) ref.current.showModal();
        } else onClose();
      }}
    >
      <div className="modal-box w-full max-w-lg">
        <header className="mb-4 flex shrink-0 items-center justify-between">
          <h2
            id={titleId}
            className="text-lg font-semibold sm:text-xl"
          >
            {title}
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-circle"
            aria-label="Tutup"
            data-modal-close="true"
            onClick={onClose}
          >
            <X
              className="size-4"
              aria-hidden="true"
            />
          </button>
        </header>
        {/* Di-unmount saat tertutup: state form reset & effect anak berhenti. */}
        {open ? children : null}
      </div>
      <form
        method="dialog"
        className="modal-backdrop"
      >
        <button>Tutup</button>
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
      data-modal-body="true"
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${className}`}
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
      className={`flex shrink-0 flex-wrap justify-end gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </footer>
  );
}
