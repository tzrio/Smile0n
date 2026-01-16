import { useSyncExternalStore } from 'react'
import { repo } from './repository'
import type { AppData } from './types'

const EVENT_NAME = 'wallDecorAdmin.data.changed'

function subscribe(callback: () => void) {
  // Important: initialize data source from subscribe (not from getSnapshot)
  // to avoid side effects during render (prevents "maximum update depth exceeded").
  ;(repo as any)?.init?.()
  const handler = () => callback()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

function getSnapshot(): AppData {
  // Must be a pure read (no writes / no init) for useSyncExternalStore.
  return repo.getAll()
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
