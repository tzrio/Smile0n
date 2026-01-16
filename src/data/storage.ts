import type { AppData } from './types'

const STORAGE_KEY = 'wallDecorAdmin.data.v1'

let memoryData: AppData | null = null
let storageAvailable: boolean | null = null

function isStorageAvailable() {
  if (storageAvailable !== null) return storageAvailable
  try {
    const testKey = '__wd_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    storageAvailable = true
  } catch {
    storageAvailable = false
  }
  return storageAvailable
}

export function loadAppData(): AppData | null {
  try {
    if (!isStorageAvailable()) {
      return memoryData
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppData
  } catch {
    return null
  }
}

export function saveAppData(data: AppData) {
  if (!isStorageAvailable()) {
    memoryData = data
    window.dispatchEvent(new Event('wallDecorAdmin.data.changed'))
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event('wallDecorAdmin.data.changed'))
}

export function clearAppData() {
  if (!isStorageAvailable()) {
    memoryData = null
    window.dispatchEvent(new Event('wallDecorAdmin.data.changed'))
    return
  }

  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('wallDecorAdmin.data.changed'))
}
