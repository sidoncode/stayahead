import { Icon } from './Icon'

export interface ToastMessage {
  id: number
  text: string
  tone: 'ok' | 'error'
}

export function Toast({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null
  return (
    <div className={`toast ${toast.tone}`} role="status" key={toast.id}>
      <Icon name={toast.tone === 'error' ? 'error' : 'saved'} size={18} />
      {toast.text}
    </div>
  )
}
