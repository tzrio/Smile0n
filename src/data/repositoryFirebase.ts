import type { AppData, AppSettings, Employee, Product, StockMovement, Transaction } from './types'
import { seedData } from './seed'
import { createId } from '../utils/id'
import { isoNow } from '../utils/date'
import { getFirestoreDb } from '../firebase/firebase'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

const EVENT_NAME = 'wallDecorAdmin.data.changed'

type Unsub = () => void

let started = false
let unsubs: Unsub[] = []

let db: ReturnType<typeof getFirestoreDb> | null = null

let snapshot: AppData = seedData

function notify() {
  window.dispatchEvent(new Event(EVENT_NAME))
}

function toIsoMaybe(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const anyVal = value as any
    if (typeof anyVal.toDate === 'function') {
      return anyVal.toDate().toISOString()
    }
  }
  try {
    return new Date(value as any).toISOString()
  } catch {
    return ''
  }
}

function mapEmployee(id: string, data: any): Employee {
  const createdAt = toIsoMaybe(data?.createdAt) || isoNow()
  const updatedAt = toIsoMaybe(data?.updatedAt) || createdAt
  const role = String(data?.role ?? '')
  return {
    id,
    name: String(data?.name ?? ''),
    position: String(data?.position ?? data?.role ?? ''),
    role: role === 'CEO' || role === 'CTO' || role === 'CMO' || role === 'PENDING' ? (role as any) : undefined,
    createdAt,
    updatedAt,
  }
}

function mapProduct(id: string, data: any): Product {
  const createdAt = toIsoMaybe(data?.createdAt) || isoNow()
  const updatedAt = toIsoMaybe(data?.updatedAt) || createdAt
  const kind = String(data?.kind ?? 'FINISHED')
  return {
    id,
    name: String(data?.name ?? ''),
    category: String(data?.category ?? ''),
    kind: kind === 'RAW_MATERIAL' || kind === 'OTHER' ? (kind as any) : 'FINISHED',
    createdAt,
    updatedAt,
  }
}

function mapStockMovement(id: string, data: any): StockMovement {
  return {
    id,
    productId: String(data?.productId ?? ''),
    type: data?.type === 'OUT' ? 'OUT' : 'IN',
    quantity: Number(data?.quantity ?? 0),
    date: toIsoMaybe(data?.date) || isoNow(),
    responsibleEmployeeId: String(data?.responsibleEmployeeId ?? data?.responsibleUserId ?? ''),
  }
}

function mapTransaction(id: string, data: any): Transaction {
  return {
    id,
    type: data?.type === 'SALE' ? 'SALE' : 'PURCHASE',
    description: String(data?.description ?? ''),
    amount: Number(data?.amount ?? 0),
    date: toIsoMaybe(data?.date) || isoNow(),
    responsibleEmployeeId: String(data?.responsibleEmployeeId ?? data?.responsibleUserId ?? ''),
  }
}

async function ensureSettingsDoc() {
  const firestoreDb = (db ??= getFirestoreDb())
  const ref = doc(firestoreDb, 'settings', 'app')
  const snap = await getDoc(ref)
  if (snap.exists()) return
  const initial: AppSettings = { cashOpeningBalance: 0 }
  await setDoc(ref, initial)
}

function start() {
  if (started) return
  started = true

  const firestoreDb = (db ??= getFirestoreDb())

  void ensureSettingsDoc().catch(() => {
    // ignore (rules might block in some configs)
  })

  // Sinkron karyawan = users/{uid}
  const employeesRef = collection(firestoreDb, 'users')
  const productsRef = collection(firestoreDb, 'products')
  const stockRef = collection(firestoreDb, 'stockMovements')
  const trxRef = collection(firestoreDb, 'transactions')
  const settingsRef = doc(firestoreDb, 'settings', 'app')

  const unsubEmployees = onSnapshot(query(employeesRef), (qs) => {
    snapshot = {
      ...snapshot,
      employees: qs.docs.map((d) => mapEmployee(d.id, d.data())),
    }
    notify()
  })

  const unsubProducts = onSnapshot(query(productsRef), (qs) => {
    snapshot = {
      ...snapshot,
      products: qs.docs.map((d) => mapProduct(d.id, d.data())),
    }
    notify()
  })

  const unsubStock = onSnapshot(query(stockRef), (qs) => {
    snapshot = {
      ...snapshot,
      stockMovements: qs.docs.map((d) => mapStockMovement(d.id, d.data())),
    }
    notify()
  })

  const unsubTrx = onSnapshot(query(trxRef), (qs) => {
    snapshot = {
      ...snapshot,
      transactions: qs.docs.map((d) => mapTransaction(d.id, d.data())),
    }
    notify()
  })

  const unsubSettings = onSnapshot(settingsRef, (ds) => {
    const data = ds.data() as any
    snapshot = {
      ...snapshot,
      settings: {
        cashOpeningBalance: Number(data?.cashOpeningBalance ?? 0),
      },
    }
    notify()
  })

  unsubs = [unsubEmployees, unsubProducts, unsubStock, unsubTrx, unsubSettings]
}

function stop() {
  for (const u of unsubs) u()
  unsubs = []
  started = false
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stop()
  })
}

export const repoFirebase = {
  init() {
    start()
  },

  getAll(): AppData {
    return snapshot
  },

  employees: {
    list(): Employee[] {
      return snapshot.employees
    },
    create(input: { name: string; position: string }): Employee {
      void input
      throw new Error(
        'Di mode Firebase, penambahan karyawan/user harus lewat Firebase Auth (Console) atau Cloud Function (lebih aman).'
      )
    },
    update(id: string, patch: Partial<Omit<Employee, 'id' | 'createdAt'>>): Employee {
      const firestoreDb = (db ??= getFirestoreDb())
      const nextUpdatedAt = isoNow()
      void updateDoc(doc(firestoreDb, 'users', id), { ...patch, updatedAt: nextUpdatedAt } as any).catch((err) => {
        console.error('Failed to update employee', err)
      })
      const current = snapshot.employees.find((x) => x.id === id)
      if (!current) throw new Error('Karyawan tidak ditemukan')
      return { ...current, ...patch, updatedAt: nextUpdatedAt }
    },
  },

  products: {
    list(): Product[] {
      return snapshot.products
    },
    create(input: { name: string; category: string; kind: Product['kind'] }): Product {
      const firestoreDb = (db ??= getFirestoreDb())
      const now = isoNow()
      const id = createId('prd')
      const p: Product = {
        id,
        name: input.name,
        category: input.category,
        kind: input.kind,
        createdAt: now,
        updatedAt: now,
      }
      void setDoc(doc(firestoreDb, 'products', id), p).catch((err) => {
        console.error('Failed to create product', err)
      })
      return p
    },
    update(id: string, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Product {
      const firestoreDb = (db ??= getFirestoreDb())
      const nextUpdatedAt = isoNow()
      void updateDoc(doc(firestoreDb, 'products', id), { ...patch, updatedAt: nextUpdatedAt } as any).catch((err) => {
        console.error('Failed to update product', err)
      })
      const current = snapshot.products.find((x) => x.id === id)
      if (!current) throw new Error('Produk tidak ditemukan')
      return { ...current, ...patch, updatedAt: nextUpdatedAt }
    },
    remove(id: string): void {
      const firestoreDb = (db ??= getFirestoreDb())
      void deleteDoc(doc(firestoreDb, 'products', id)).catch((err) => {
        console.error('Failed to delete product', err)
      })
      // related stockMovements are left as-is in Firestore (log/audit). UI will show productId fallback.
    },
  },

  stockMovements: {
    list(): StockMovement[] {
      return snapshot.stockMovements
    },
    create(input: Omit<StockMovement, 'id'>): StockMovement {
      const firestoreDb = (db ??= getFirestoreDb())
      if (input.quantity <= 0) throw new Error('Qty harus > 0')
      const id = createId('stk')
      const m: StockMovement = { ...input, id }
      void setDoc(doc(firestoreDb, 'stockMovements', id), m).catch((err) => {
        console.error('Failed to create stock movement', err)
      })
      return m
    },
  },

  transactions: {
    list(): Transaction[] {
      return snapshot.transactions
    },
    create(input: Omit<Transaction, 'id'>): Transaction {
      const firestoreDb = (db ??= getFirestoreDb())
      if (input.amount <= 0) throw new Error('Nominal harus > 0')
      const id = createId('trx')
      const t: Transaction = { ...input, id }
      void setDoc(doc(firestoreDb, 'transactions', id), t).catch((err) => {
        console.error('Failed to create transaction', err)
      })
      return t
    },
  },

  settings: {
    setCashOpeningBalance(value: number) {
      const firestoreDb = (db ??= getFirestoreDb())
      void setDoc(doc(firestoreDb, 'settings', 'app'), { cashOpeningBalance: value }, { merge: true }).catch((err) => {
        console.error('Failed to set cash opening balance', err)
      })
    },
  },
}
