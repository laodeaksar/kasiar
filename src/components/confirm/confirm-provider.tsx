import type { ReactNode } from "react";

import { useCallback, useMemo, useRef, useState } from "react";

import { Modal, ModalBody, ModalFooter } from "~/components/modal";

import type { ConfirmOptions } from "./use-confirm";

import { ConfirmContext } from "./use-confirm";

type PendingConfirm = ConfirmOptions & { resolve: (answer: boolean) => void };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        if (pendingRef.current) {
          resolve(false);
          return;
        }
        const request = { ...options, resolve };
        pendingRef.current = request;
        setPending(request);
      }),
    [],
  );
  const finish = useCallback((answer: boolean) => {
    pendingRef.current?.resolve(answer);
    pendingRef.current = null;
    setPending(null);
  }, []);
  const value = useMemo(() => ({ confirm }), [confirm]);
  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={pending !== null}
        onClose={() => finish(false)}
        title={pending?.title ?? "Yakin?"}
        descriptionId="confirm-message"
        size="kecil"
        initialFocusRef={pending?.danger ? cancelButtonRef : undefined}
      >
        <ModalBody id="confirm-message">
          <p>{pending?.message}</p>
        </ModalBody>
        <ModalFooter>
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn btn-outline min-h-11"
            data-modal-action="true"
            onClick={() => finish(false)}
          >
            {pending?.cancelText ?? "Batal"}
          </button>
          <button
            type="button"
            className={`btn min-h-11 ${pending?.danger ? "btn-error" : "btn-primary"}`}
            data-modal-action="true"
            onClick={() => finish(true)}
          >
            {pending?.confirmText ?? "Lanjutkan"}
          </button>
        </ModalFooter>
      </Modal>
    </ConfirmContext.Provider>
  );
}
