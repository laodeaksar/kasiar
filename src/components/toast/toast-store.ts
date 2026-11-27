import { useSyncExternalStore } from "react";

export type ToastKind = "sukses" | "info" | "peringatan" | "error";
export type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

const EMPTY: ToastItem[] = [];
let items: ToastItem[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function dismissToast(id: number) {
  const timer = timers.get(id);
  if (timers.has(id) && timer !== undefined) clearTimeout(timer);
  timers.delete(id);
  if (!items.some((item) => item.id === id)) return;
  items = items.filter((item) => item.id !== id);
  emit();
}

export function pushToast(kind: ToastKind, message: string) {
  if (items.some((item) => item.message === message)) return;

  const removedItems = items.slice(0, Math.max(0, items.length - 2));
  removedItems.forEach((item) => {
    const timer = timers.get(item.id);
    if (timers.has(item.id) && timer !== undefined) clearTimeout(timer);
    timers.delete(item.id);
  });

  const item = { id: nextId++, kind, message };
  items = [...items.slice(-2), item];
  emit();

  if (kind !== "error") {
    const duration = kind === "peringatan" ? 5000 : 3000;
    timers.set(
      item.id,
      setTimeout(() => dismissToast(item.id), duration),
    );
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => items;
const getServerSnapshot = () => EMPTY;

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const toast = {
  success: (message: string) => pushToast("sukses", message),
  error: (message: string) => pushToast("error", message),
  info: (message: string) => pushToast("info", message),
  warning: (message: string) => pushToast("peringatan", message),
};
