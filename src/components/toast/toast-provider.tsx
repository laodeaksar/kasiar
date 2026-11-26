import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { dismissToast, pushToast, type ToastKind, useToasts } from './toast-store'

type ToastContextValue = { showToast: (kind: ToastKind, message: string) => void; dismissToast: (id: number) => void }
const ToastContext = createContext<ToastContextValue | null>(null)
const classes: Record<ToastKind, string> = { sukses: 'alert-success', info: 'alert-info', peringatan: 'alert-warning', error: 'alert-error' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const items = useToasts()
  const value = useMemo(() => ({ showToast: pushToast, dismissToast }), [])

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
