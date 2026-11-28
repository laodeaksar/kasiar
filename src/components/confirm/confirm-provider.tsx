import type { ReactNode } from "react";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Modal, ModalBody, ModalFooter } from "~/components/modal";

import { ConfirmContext } from "./use-confirm";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};
type PendingConfirm = ConfirmOptions & {
  resolve: (answer: boolean) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const messageId = `confirm-message-${useId().replaceAll(":", "")}`;

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

  // Jika provider di-unmount saat konfirmasi masih terbuka, jangan biarkan promise menggantung.
  useEffect(
    () => () => {
      pendingRef.current?.resolve(false);
      pendingRef.current = null;
    },
    [],
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={pending !== null}
        onClose={() => finish(false)}
        title={pending?.title ?? "Yakin?"}
      >
        <ModalBody id={messageId}>
          <p className="whitespace-pre-line">{pending?.message}</p>
        </ModalBody>
        <ModalFooter>
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn"
            data-modal-action="true"
            onClick={() => finish(false)}
          >
            {pending?.cancelText ?? "Batal"}
          </button>
          <button
            type="button"
            className={`btn ${pending?.danger ? "btn-error" : "btn-primary"}`}
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
