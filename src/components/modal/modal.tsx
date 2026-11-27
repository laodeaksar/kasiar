import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";

type ModalSize = "kecil" | "sedang" | "besar";
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  descriptionId?: string;
  size?: ModalSize;
  placement?: "bawah" | "tengah";
  canClose?: boolean;
  closeGuard?: () => boolean | Promise<boolean>;
  initialFocusRef?: { current: HTMLElement | null };
  children: ReactNode;
};

const RequestCloseContext = createContext<(() => void) | null>(null);

// Scroll lock global: aman untuk modal bertumpuk / ditutup tidak berurutan.
let scrollLockCount = 0;
let scrollLockPrevOverflow = "";
function lockScroll() {
  if (scrollLockCount === 0) {
    scrollLockPrevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0)
    document.body.style.overflow = scrollLockPrevOverflow;
}

export function Modal({
  open,
  onClose,
  title,
  descriptionId,
  size = "sedang",
  placement = "bawah",
  canClose = true,
  closeGuard,
  initialFocusRef,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const backdropPointerDown = useRef(false);
  const closing = useRef(false);
  const reactId = useId();
  const titleId = `modal-title-${reactId.replaceAll(":", "")}`;
  const latest = useRef({
    open,
    onClose,
    canClose,
    closeGuard,
  });
  useEffect(() => {
    latest.current = {
      open,
      onClose,
      canClose,
      closeGuard,
    };
  }, [open, onClose, canClose, closeGuard]);

  const requestClose = useCallback(async () => {
    const current = latest.current;
    if (!current.open || !current.canClose || closing.current) return;
    closing.current = true;
    try {
      const allowed = current.closeGuard ? await current.closeGuard() : true;
      const updated = latest.current;
      if (allowed && updated.open && updated.canClose) updated.onClose();
    } catch (error) {
      // Jika pemeriksaan sebelum tutup gagal, pertahankan modal tetap terbuka.
      if (import.meta.env.DEV) console.error("closeGuard gagal:", error);
    } finally {
      closing.current = false;
    }
  }, []);

  const contextValue = useMemo(
    () => () => {
      void requestClose();
    },
    [requestClose],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    lockScroll();

    const vv = window.visualViewport;

    // Ikuti area yang benar-benar terlihat (mengecil saat keyboard muncul),
    // supaya footer modal tidak tertutup keyboard.
    const fitToVisualViewport = () => {
      if (!vv) return;
      dialog.style.height = `${vv.height}px`;
      dialog.style.top = `${vv.offsetTop}px`;
    };
    const scrollFocusedFieldIntoView = () => {
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        dialog.contains(active) &&
        active.closest("[data-modal-body]")
      ) {
        active.scrollIntoView({ block: "nearest" });
      }
    };
    const onViewportChange = () => {
      fitToVisualViewport();
      scrollFocusedFieldIntoView();
    };

    fitToVisualViewport();
    const frame = window.requestAnimationFrame(() => {
      if (!dialog.open) return;
      const firstField = dialog.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      const target =
        initialFocusRef?.current ??
        firstField ??
        dialog.querySelector<HTMLElement>(
          "[data-modal-action]:not([disabled])",
        ) ??
        closeButtonRef.current;
      target?.focus({ preventScroll: true });
      scrollFocusedFieldIntoView();
    });
    vv?.addEventListener("resize", onViewportChange);
    vv?.addEventListener("scroll", onViewportChange);

    return () => {
      window.cancelAnimationFrame(frame);
      vv?.removeEventListener("resize", onViewportChange);
      vv?.removeEventListener("scroll", onViewportChange);
      dialog.style.height = "";
      dialog.style.top = "";
      if (dialog.open) dialog.close();
      unlockScroll();
    };
  }, [initialFocusRef, open]);

  function onPointerDown(event: React.PointerEvent<HTMLDialogElement>) {
    backdropPointerDown.current = event.target === event.currentTarget;
  }
  function onPointerUp(event: React.PointerEvent<HTMLDialogElement>) {
    const endedOnBackdrop = event.target === event.currentTarget;
    const beganOnBackdrop = backdropPointerDown.current;
    backdropPointerDown.current = false;
    if (beganOnBackdrop && endedOnBackdrop) void requestClose();
  }

  const sizeClasses: Record<ModalSize, string> = {
    kecil: "sm:w-[24rem]",
    sedang: "sm:w-[32rem]",
    besar: "sm:w-[42rem]",
  };

  const dialogPlacement =
    placement === "tengah"
      ? "modal-middle p-4"
      : "modal-bottom sm:modal-middle p-0 sm:p-4";
  const boxPlacement =
    placement === "tengah"
      ? "rounded-box max-h-[calc(100%-2rem)] max-w-[calc(100vw-2rem)]"
      : "max-h-[90%] max-w-none rounded-t-2xl rounded-b-none sm:max-h-[calc(100%-2rem)] sm:max-w-[calc(100vw-2rem)] sm:rounded-box";

  return (
    <RequestCloseContext.Provider value={contextValue}>
      <dialog
        ref={dialogRef}
        className={`modal ${dialogPlacement} kasiar-modal fixed inset-0 h-dvh w-screen max-h-none max-w-none overflow-hidden border-0 bg-transparent text-base-content`}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault();
          void requestClose();
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          backdropPointerDown.current = false;
        }}
      >
        <div
          className={`modal-box flex w-full flex-col overflow-hidden bg-base-100 p-0 shadow-xl ${boxPlacement} ${sizeClasses[size]}`}
        >
          <header className="relative flex shrink-0 items-center border-b border-base-300 px-4 py-3 pr-16 sm:px-6">
            <h2
              id={titleId}
              className="text-lg font-semibold sm:text-xl"
            >
              {title}
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="btn btn-sm btn-ghost btn-circle absolute right-2 top-1/2 -translate-y-1/2 disabled:opacity-40"
              aria-label="Tutup"
              data-modal-close="true"
              disabled={!canClose}
              onClick={() => {
                void requestClose();
              }}
            >
              <X
                className="size-5"
                aria-hidden="true"
              />
            </button>
          </header>
          {/* Di-unmount saat tertutup: state form reset & effect anak berhenti. */}
          {open ? children : null}
        </div>
      </dialog>
    </RequestCloseContext.Provider>
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
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 ${className}`}
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
      className={`flex shrink-0 flex-wrap justify-end gap-2 border-t border-base-300 bg-base-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4 ${className}`}
    >
      {children}
    </footer>
  );
}

export function useModalClose() {
  const requestClose = useContext(RequestCloseContext);
  if (!requestClose)
    throw new Error("useModalClose harus digunakan di dalam Modal.");
  return requestClose;
}
