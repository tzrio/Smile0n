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

function normalizeApiData(raw: AppData): AppData {
  return {
    ...raw,
    employees: Array.isArray(raw.employees) ? raw.employees : [],
    products: Array.isArray(raw.products) ? raw.products : [],
    stockMovements: Array.isArray(raw.stockMovements) ? raw.stockMovements : [],
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    productions: Array.isArray((raw as any).productions) ? (raw as any).productions : [],
    meetings: Array.isArray((raw as any).meetings) ? (raw as any).meetings : [],
    contentSchedules: Array.isArray((raw as any).contentSchedules) ? (raw as any).contentSchedules : [],
    settings: raw.settings ?? { cashOpeningBalance: 0 },
  }
}

export async function refreshFromApi() {
  if (loading) return
  loading = true
  try {
    const next = await apiRepo.getAll()
    snapshot = normalizeApiData(next)
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
