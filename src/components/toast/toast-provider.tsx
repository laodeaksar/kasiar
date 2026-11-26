import { dismissToast, type ToastKind, useToasts } from './toast-store'

const classes: Record<ToastKind, string> = { sukses: 'alert-success', info: 'alert-info', peringatan: 'alert-warning', error: 'alert-error' }

export function Toaster() {
  const items = useToasts()

  return <div className="toast toast-top toast-center z-[100] sm:toast-end" aria-live="polite" aria-atomic="false">
      {items.map((item) => <div key={item.id} className={`alert ${classes[item.kind]} shadow-lg`} role={item.kind === 'error' ? 'alert' : 'status'}>
        <span>{item.message}</span><button className="btn btn-ghost btn-sm" aria-label="Tutup notifikasi" onClick={() => dismissToast(item.id)}>Tutup</button>
      </div>)}
    </div>
}
