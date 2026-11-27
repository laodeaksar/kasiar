import { createContext, useContext } from "react";

import type { ConfirmOptions } from "./confirm-provider";

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context)
    throw new Error("useConfirm harus digunakan di dalam ConfirmProvider.");
  return context.confirm;
}
