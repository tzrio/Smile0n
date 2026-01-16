import type { AppData, Employee, Product, ProductKind, StockMovement, Transaction } from './types'
import { loadAppData, saveAppData } from './storage'
import { seedData } from './seed'
import { createId } from '../utils/id'
import { isoNow } from '../utils/date'

type Update<T> = Partial<Omit<T, 'id' | 'createdAt'>>

let cached: AppData | null = null

function cloneSeed(): AppData {
  // seedData is plain JSON-serializable, so JSON clone is sufficient
  return JSON.parse(JSON.stringify(seedData)) as AppData
}

function normalizeData(data: AppData): AppData {
  data.employees = Array.isArray(data.employees) ? data.employees : []
  data.products = Array.isArray(data.products)
    ? data.products.map((p) => {
        const kind = (p as any).kind as ProductKind | undefined
        return { ...p, kind: kind ?? 'FINISHED' }
      })
    : []
  data.stockMovements = Array.isArray(data.stockMovements) ? data.stockMovements : []
  data.transactions = Array.isArray(data.transactions) ? data.transactions : []
  data.settings = data.settings ?? { cashOpeningBalance: 0 }
  return data
}

function ensureData(): AppData {
  if (cached) return cached
  const existing = loadAppData()
  cached = normalizeData((existing ?? cloneSeed()) as AppData)
  return cached
}

function commit(mutator: (data: AppData) => void) {
  const data = ensureData()
  mutator(data)
  cached = data
  saveAppData(data)
}

export const repoLocal = {
  getAll(): AppData {
    return ensureData()
  },

  employees: {
    list(): Employee[] {
      return ensureData().employees
    },
    create(input: { name: string; position: string }): Employee {
      const now = isoNow()
      const e: Employee = {
        id: createId('emp'),
        name: input.name,
        position: input.position,
        createdAt: now,
        updatedAt: now,
      }
      commit((d) => {
        d.employees.unshift(e)
      })
      return e
    },
    update(id: string, patch: Update<Employee>): Employee {
      let updated: Employee | null = null
      commit((d) => {
        d.employees = d.employees.map((e) => {
          if (e.id !== id) return e
          updated = { ...e, ...patch, updatedAt: isoNow() }
          return updated
        })
      })
      if (!updated) throw new Error('Karyawan tidak ditemukan')
      return updated
    },
  },

  products: {
    list(): Product[] {
      return ensureData().products
    },
    create(input: { name: string; category: string; kind: ProductKind }): Product {
      const now = isoNow()
      const p: Product = {
        id: createId('prd'),
        name: input.name,
        category: input.category,
        kind: input.kind,
        createdAt: now,
        updatedAt: now,
      }
      commit((d) => {
        d.products.unshift(p)
      })
      return p
    },
    update(id: string, patch: Update<Product>): Product {
      let updated: Product | null = null
      commit((d) => {
        d.products = d.products.map((p) => {
          if (p.id !== id) return p
          updated = { ...p, ...patch, updatedAt: isoNow() }
          return updated
        })
      })
      if (!updated) throw new Error('Produk tidak ditemukan')
      return updated
    },
    remove(id: string) {
      commit((d) => {
        const before = d.products.length
        d.products = d.products.filter((p) => p.id !== id)
        if (d.products.length === before) {
          throw new Error('Produk tidak ditemukan')
        }
        d.stockMovements = d.stockMovements.filter((m) => m.productId !== id)
      })
    },
  },

  stockMovements: {
    list(): StockMovement[] {
      return ensureData().stockMovements
    },
    create(input: Omit<StockMovement, 'id'>): StockMovement {
      if (input.quantity <= 0) throw new Error('Qty harus > 0')
      const m: StockMovement = { ...input, id: createId('stk') }
      commit((d) => {
        d.stockMovements.unshift(m)
      })
      return m
    },
  },

  transactions: {
    list(): Transaction[] {
      return ensureData().transactions
    },
    create(input: Omit<Transaction, 'id'>): Transaction {
      if (input.amount <= 0) throw new Error('Nominal harus > 0')
      const t: Transaction = { ...input, id: createId('trx') }
      commit((d) => {
        d.transactions.unshift(t)
      })
      return t
    },
  },

  settings: {
    setCashOpeningBalance(value: number) {
      commit((d) => {
        d.settings.cashOpeningBalance = value
      })
    },
  },
}
