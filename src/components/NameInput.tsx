import { useState } from 'react'
import { Icon } from './Icon'

interface Props {
  initial?: string
  placeholder: string
  /** Returns an error message to show, or null when accepted. */
  onSubmit: (value: string) => string | null
  onCancel: () => void
}

export function NameInput({ initial = '', placeholder, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const err = onSubmit(value)
    if (err) setError(err)
  }

  return (
    <div className="name-input">
      <input
        autoFocus
        className={`field field-sm${error ? ' invalid' : ''}`}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => {
          setValue(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={() => !error && onCancel()}
      />
      {error && (
        <span className="field-error" role="alert">
          <Icon name="error" size={14} />
          {error}
        </span>
      )}
    </div>
  )
}
