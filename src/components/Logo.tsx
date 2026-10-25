import gold from '../assets/brand/logo-symbol-gold.svg'

export function LogoSymbol({ size = 28 }: { size?: number }) {
  return <img src={gold} width={size} height={size} alt="" draggable={false} />
}

export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      Stay Ahead
    </span>
  )
}

export function LogoLockup({ symbol = 28, text = 15 }: { symbol?: number; text?: number }) {
  return (
    <span className="lockup">
      <LogoSymbol size={symbol} />
      <Wordmark size={text} />
    </span>
  )
}
