import { useRef } from 'react'
import { Icon } from './Icon'
import { LogoSymbol } from './Logo'

interface Props {
  onStart: () => void
  onImport: (files: File[]) => void
}

const STEPS = [
  { icon: 'new-note', title: 'Write', text: 'A quiet editor with Markdown shortcuts.' },
  { icon: 'folders', title: 'Organize', text: 'Folders, tags and pins keep notes close.' },
  { icon: 'export', title: 'Export', text: 'Back up to Markdown or JSON anytime.' },
] as const

export function Welcome({ onStart, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="welcome">
      <div className="welcome-ghost" aria-hidden="true">
        <div className="ghost-side">
          <span className="ghost-bar w40" />
          <span className="ghost-btn" />
          <span className="ghost-bar w70" />
          <span className="ghost-bar w50" />
          <span className="ghost-bar w65" />
        </div>
        <div className="ghost-list">
          <span className="ghost-card" />
          <span className="ghost-card" />
          <span className="ghost-card" />
        </div>
        <div className="ghost-doc">
          <span className="ghost-bar w60 tall" />
          <span className="ghost-bar w90" />
          <span className="ghost-bar w80" />
        </div>
      </div>

      <section className="glass-card">
        <LogoSymbol size={48} />
        <h1>Write it down before it slips away.</h1>
        <p>A focused notebook in your browser. Everything stays on this device.</p>
        <div className="welcome-actions">
          <button className="btn btn-primary btn-xl" onClick={onStart}>
            Start writing
          </button>
          <button className="link-btn" onClick={() => fileRef.current?.click()}>
            <Icon name="import" size={16} />
            Import a backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.md,.markdown,.txt"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) onImport([...e.target.files])
              e.target.value = ''
            }}
          />
        </div>
        <div className="welcome-steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="welcome-step">
              <span className="step-top">
                <Icon name={s.icon} size={20} gradient />
                <span className="step-num">0{i + 1}</span>
              </span>
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
