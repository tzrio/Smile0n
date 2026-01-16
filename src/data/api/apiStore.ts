import type { AppData } from '../types'
import { seedData } from '../seed'
import { apiRepo } from './apiRepository'

const EVENT_NAME = 'wallDecorAdmin.data.changed'

let snapshot: AppData = seedData
let loading = false
let loadedOnce = false

function notify() {
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function getApiSnapshot(): AppData {
  if (!loadedOnce && !loading) {
    void refreshFromApi()
  }
  return snapshot
}

export async function refreshFromApi() {
  if (loading) return
  loading = true
  try {
    snapshot = await apiRepo.getAll()
    loadedOnce = true
    notify()
  } finally {
    loading = false
  }
}

export async function mutateAndRefresh<T>(mutator: () => Promise<T>) {
  const result = await mutator()
  await refreshFromApi()
  return result
}
