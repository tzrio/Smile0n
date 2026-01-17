/**
 * Repo meta hook used for "initial hydration" UI states (e.g. skeleton loading).
 * Uses `useSyncExternalStore` and returns a stable snapshot object to avoid
 * accidental re-render loops.
 */
import { useSyncExternalStore } from 'react'
import { repo } from './repository'

const EVENT_NAME = 'wallDecorAdmin.data.changed'

export type RepoMeta = {
  ready: boolean
  updatedAt?: string
}

let lastSnapshot: RepoMeta | null = null

function subscribe(callback: () => void) {
  const handler = () => callback()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

function getSnapshot(): RepoMeta {
  const raw = (repo as any)?.getMeta?.()
  const next: RepoMeta =
    raw && typeof raw === 'object' && 'ready' in raw
      ? ({ ready: Boolean((raw as any).ready), updatedAt: (raw as any).updatedAt } as RepoMeta)
      : { ready: true }

  if (lastSnapshot && lastSnapshot.ready === next.ready && lastSnapshot.updatedAt === next.updatedAt) {
    return lastSnapshot
  }
  lastSnapshot = next
  return next
}

export function useRepoMeta(): RepoMeta {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
