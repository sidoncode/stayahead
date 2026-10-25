import { useCallback, useEffect, useState } from 'react'
import gold from '../assets/brand/logo-symbol-gold.svg'
import mask from '../assets/brand/logo-mask.svg'
import { SESSION_KEY, TOTAL_MS } from '../lib/splash'

export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // ignore
    }
    onDone()
  }, [onDone])

  useEffect(() => {
    const t = window.setTimeout(finish, TOTAL_MS)
    return () => window.clearTimeout(t)
  }, [finish])

  const skip = useCallback(() => {
    setLeaving(true)
    window.setTimeout(finish, 240)
  }, [finish])

  useEffect(() => {
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [skip])

  return (
    <div className={`splash${leaving ? ' leaving' : ''}`} onClick={skip} role="presentation">
      <div className="splash-glow" />
      <div className="splash-logo">
        <div className="splash-symbol">
          <img src={gold} alt="" />
          <div className="splash-mask" style={{ maskImage: `url(${mask})`, WebkitMaskImage: `url(${mask})` }}>
            <div className="splash-sweep" />
          </div>
        </div>
        <div className="splash-word">Stay Ahead</div>
      </div>
      <div className="splash-tag">Your notes, quietly organized.</div>
      <span className="splash-skip">Click or press any key to skip</span>
    </div>
  )
}
