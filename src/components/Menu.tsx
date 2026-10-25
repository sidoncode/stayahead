import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './icons.generated'

interface TriggerProps {
  onClick: () => void
  'aria-expanded': boolean
  'aria-haspopup': 'menu'
}

interface Props {
  trigger: (props: TriggerProps) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
}

export function Menu({ trigger, children, align = 'right' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu-wrap" ref={ref}>
      {trigger({ onClick: () => setOpen((o) => !o), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <div className={`menu menu-${align}`} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

interface ItemProps {
  icon?: IconName
  label: string
  onClick: () => void
  selected?: boolean
  danger?: boolean
}

export function MenuItem({ icon, label, onClick, selected, danger }: ItemProps) {
  return (
    <button
      role="menuitem"
      className={`menu-item${selected ? ' selected' : ''}${danger ? ' danger' : ''}`}
      onClick={onClick}
    >
      {icon && <Icon name={icon} size={18} />}
      <span>{label}</span>
    </button>
  )
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="menu-label">{children}</div>
}
