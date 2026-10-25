import { useRef } from 'react'
import { exportJson, exportMarkdown } from '../lib/backup'
import { formatBytes, STORAGE_LIMIT_BYTES } from '../lib/storage'
import type { AppData } from '../types'
import { Icon } from './Icon'
import { LogoLockup } from './Logo'
import { Modal } from './Modal'

interface Props {
  data: AppData
  usedBytes: number
  usedRatio: number
  onImport: (files: File[]) => void
  onClose: () => void
}

export function SettingsModal({ data, usedBytes, usedRatio, onImport, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const empty = data.notes.length === 0

  return (
    <Modal title="Settings" onClose={onClose}>
      <section className="settings-block">
        <h3>Backup</h3>
        <p>Your notes live only in this browser. Export a copy now and then, or move them to another device.</p>
        <div className="btn-row">
          <button className="btn btn-secondary" disabled={empty} onClick={() => exportMarkdown(data)}>
            <Icon name="export" />
            Export Markdown
          </button>
          <button className="btn btn-secondary" disabled={empty} onClick={() => exportJson(data)}>
            <Icon name="export" />
            Export JSON
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="import" />
            Import
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
        <span className="hint">Import accepts a StayAhead JSON backup or Markdown files.</span>
      </section>

      <section className="settings-block">
        <h3>Storage</h3>
        <div className="meter">
          <div style={{ width: `${Math.max(2, usedRatio * 100)}%` }} />
        </div>
        <span className="storage-value">
          {formatBytes(usedBytes)} <span>of {formatBytes(STORAGE_LIMIT_BYTES)} browser limit</span>
        </span>
      </section>

      <section className="settings-block about">
        <LogoLockup symbol={24} text={15} />
        <span className="hint">
          {data.notes.length} {data.notes.length === 1 ? 'note' : 'notes'} · {data.folders.length}{' '}
          {data.folders.length === 1 ? 'folder' : 'folders'}
        </span>
      </section>
    </Modal>
  )
}
