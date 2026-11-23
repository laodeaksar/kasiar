import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type ToastKind = 'sukses' | 'info' | 'peringatan' | 'error'
type ToastItem = { id: number; kind: ToastKind; message: string }
type ToastContextValue = { showToast: (kind: ToastKind, message: string) => void; dismissToast: (id: number) => void }
const ToastContext = createContext<ToastContextValue | null>(null)
const classes: Record<ToastKind, string> = { sukses: 'alert-success', info: 'alert-info', peringatan: 'alert-warning', error: 'alert-error' }
let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const dismissToast = useCallback((id: number) => setItems((old) => old.filter((item) => item.id !== id)), [])
  const showToast = useCallback((kind: ToastKind, message: string) => {
    setItems((old) => {
      if (old.some((item) => item.message === message)) return old
      return [...old.slice(-2), { id: ++nextId, kind, message }]
    })
  }, [])
  useEffect(() => {
    const timers = items.filter((item) => item.kind !== 'error').map((item) => window.setTimeout(() => dismissToast(item.id), item.kind === 'peringatan' ? 5000 : 3000))
    return () => timers.forEach(window.clearTimeout)
  }, [items, dismissToast])
  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast toast-top toast-center z-[100] sm:toast-end" aria-live="polite" aria-atomic="false">
      {items.map((item) => <div key={item.id} className={`alert ${classes[item.kind]} shadow-lg`} role={item.kind === 'error' ? 'alert' : 'status'}>
        <span>{item.message}</span><button className="btn btn-ghost btn-sm" aria-label="Tutup notifikasi" onClick={() => dismissToast(item.id)}>Tutup</button>
      </div>)}
    </div>
  </ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast harus digunakan di dalam ToastProvider.')
  return context
}
