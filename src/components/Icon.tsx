import { ICONS, type IconName } from './icons.generated'

interface Props {
  name: IconName
  size?: number
  /** Strokes the icon with the brand gold gradient (needs <BrandDefs /> in the tree). */
  gradient?: boolean
  className?: string
}

export function Icon({ name, size = 18, gradient, className }: Props) {
  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={gradient ? 'url(#sa-accent)' : 'currentColor'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={gradient ? { color: 'var(--sa-accent-solid)' } : undefined}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

/** Shared SVG paint servers. Render once near the app root. */
export function BrandDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sa-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8D5A3" />
          <stop offset="1" stopColor="#B8956A" />
        </linearGradient>
      </defs>
    </svg>
  )
}
