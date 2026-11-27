import { createContext, useContext } from "react";

type ConfirmContextValue = { confirm: (options: ConfirmOptions) => Promise<boolean> };

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm harus digunakan di dalam ConfirmProvider.");
  return context.confirm;
}
