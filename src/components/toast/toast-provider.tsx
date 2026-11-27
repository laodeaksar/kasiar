import type { ReactNode } from "react";

import { useEffect, useRef } from "react";

import type { ToastKind } from "./toast-store";

import { dismissToast, useToasts } from "./toast-store";

const classes: Record<ToastKind, string> = {
  sukses: "alert-success",
  info: "alert-info",
  peringatan: "alert-warning",
  error: "alert-error",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

function Toaster() {
  const items = useToasts();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (items.length > 0) {
      try {
        if (element.matches(":popover-open")) element.hidePopover();
        element.showPopover();
      } catch {
        // Peramban tanpa dukungan Popover tetap menampilkan wadah toast biasa.
      }
    } else if (element.matches(":popover-open")) {
      element.hidePopover();
    }
  }, [items]);

  return (
    <div
      ref={container}
      popover="manual"
      className="toast toast-top toast-center z-[100] sm:toast-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`alert ${classes[item.kind]} shadow-lg`}
          role={item.kind === "error" ? "alert" : "status"}
        >
          <span>{item.message}</span>
          <button
            className="btn btn-ghost btn-sm"
            aria-label="Tutup notifikasi"
            onClick={() => dismissToast(item.id)}
          >
            Tutup
          </button>
        </div>
      ))}
    </div>
  );
}
