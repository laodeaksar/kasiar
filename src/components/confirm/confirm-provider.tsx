import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type ConfirmOptions = { title?: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }
type PendingConfirm = ConfirmOptions & { resolve: (answer: boolean) => void }
type ConfirmContextValue = { confirm: (options: ConfirmOptions) => Promise<boolean> }
const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    if (pendingRef.current) { resolve(false); return }
    const request = { ...options, resolve }
    pendingRef.current = request
    setPending(request)
  }), [])
  const finish = (answer: boolean) => { pendingRef.current?.resolve(answer); pendingRef.current = null; setPending(null) }
  useEffect(() => {
    if (!pending) return
    const cancelOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(false) }
    window.addEventListener('keydown', cancelOnEscape)
    return () => window.removeEventListener('keydown', cancelOnEscape)
  }, [pending])
  const value = useMemo(() => ({ confirm }), [confirm])
  return <ConfirmContext.Provider value={value}>
    {children}
    {pending && <dialog open className="modal modal-open" aria-labelledby="confirm-title" aria-describedby="confirm-message" onCancel={(event) => { event.preventDefault(); finish(false) }}>
      <div className="modal-box">
        <h2 id="confirm-title" className="text-xl font-bold">{pending.title ?? 'Yakin?'}</h2>
        <p id="confirm-message" className="py-4">{pending.message}</p>
        <div className="modal-action">
          <button className="btn btn-outline min-h-11" onClick={() => finish(false)} autoFocus={pending.danger}>{pending.cancelText ?? 'Batal'}</button>
          <button className={`btn min-h-11 ${pending.danger ? 'btn-error' : 'btn-primary'}`} onClick={() => finish(true)}>{pending.confirmText ?? 'Lanjutkan'}</button>
        </div>
      </div>
      <button className="modal-backdrop" aria-label="Tutup konfirmasi" onClick={() => finish(false)}>Tutup</button>
    </dialog>}
  </ConfirmContext.Provider>
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm harus digunakan di dalam ConfirmProvider.')
  return context.confirm
}
