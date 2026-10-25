export const SESSION_KEY = 'stayahead.splash.seen'
/** Keyframes run over 7s: logo resolves 0-1.8s, sweep 1.8-3.5s, tagline hold to 5.2s, fade by 6.2s. */
export const TOTAL_MS = 6300

export function shouldShowSplash(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false
  } catch {
    // storage blocked: show it, it only costs a few seconds
  }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
