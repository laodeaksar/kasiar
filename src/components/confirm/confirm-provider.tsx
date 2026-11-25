import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Modal, ModalBody, ModalFooter } from '../modal'

type ConfirmOptions = { title?: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }
type PendingConfirm = ConfirmOptions & { resolve: (answer: boolean) => void }
type ConfirmContextValue = { confirm: (options: ConfirmOptions) => Promise<boolean> }
const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    if (pendingRef.current) { resolve(false); return }
    const request = { ...options, resolve }
    pendingRef.current = request
    setPending(request)
  }), [])
  const finish = useCallback((answer: boolean) => { pendingRef.current?.resolve(answer); pendingRef.current = null; setPending(null) }, [])
  const value = useMemo(() => ({ confirm }), [confirm])
  return <ConfirmContext.Provider value={value}>
    {children}
    <Modal open={pending !== null} onClose={() => finish(false)} title={pending?.title ?? 'Yakin?'} descriptionId="confirm-message" size="kecil" initialFocusRef={pending?.danger ? cancelButtonRef : undefined}>
      <ModalBody id="confirm-message"><p>{pending?.message}</p></ModalBody>
      <ModalFooter>
        <button ref={cancelButtonRef} type="button" className="btn btn-outline min-h-11" data-modal-action="true" onClick={() => finish(false)}>{pending?.cancelText ?? 'Batal'}</button>
        <button type="button" className={`btn min-h-11 ${pending?.danger ? 'btn-error' : 'btn-primary'}`} data-modal-action="true" onClick={() => finish(true)}>{pending?.confirmText ?? 'Lanjutkan'}</button>
      </ModalFooter>
    </Modal>
  </ConfirmContext.Provider>
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm harus digunakan di dalam ConfirmProvider.')
  return context.confirm
}
