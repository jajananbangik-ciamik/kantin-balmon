import { useEffect, useRef } from 'react'

export const LIVE_REFRESH_INTERVAL = 20000

const subscribers = new Set()
let timer = null

const notify = () => {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
  subscribers.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

const startTimer = () => {
  if (timer || typeof window === 'undefined') return
  timer = setInterval(notify, LIVE_REFRESH_INTERVAL)
  document.addEventListener('visibilitychange', notify)
  window.addEventListener('focus', notify)
}

const stopTimer = () => {
  if (subscribers.size || typeof window === 'undefined') return
  clearInterval(timer)
  timer = null
  document.removeEventListener('visibilitychange', notify)
  window.removeEventListener('focus', notify)
}

export function useLiveRefresh(callback, { enabled = true } = {}) {
  const ref = useRef(callback)
  ref.current = callback

  useEffect(() => {
    if (!enabled) return undefined
    const sub = () => ref.current()
    subscribers.add(sub)
    startTimer()
    return () => {
      subscribers.delete(sub)
      stopTimer()
    }
  }, [enabled])
}
