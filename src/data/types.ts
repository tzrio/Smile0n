/**
 * Domain/data types for the app.
 * These types are shared by all repository implementations (local/firebase/api).
 */
export type Employee = {
  id: string
  name: string
  position: string
  role?: 'CEO' | 'CTO' | 'CMO' | 'PENDING'
  createdAt: string
  updatedAt: string
}

export type ProductKind = 'FINISHED' | 'RAW_MATERIAL' | 'OTHER'

export type Product = {
  id: string
  name: string
  category: string
  kind: ProductKind
  createdAt: string
  updatedAt: string
}

export type StockMovementType = 'IN' | 'OUT'

export type StockMovement = {
  id: string
  productId: string
  type: StockMovementType
  quantity: number
  date: string
  responsibleEmployeeId: string
  sourceType?: 'MANUAL' | 'TRANSACTION' | 'PRODUCTION'
  sourceId?: string
}

export type TransactionType = 'PURCHASE' | 'SALE'

export type TransactionItem = {
  productId: string
  quantity: number
  unitPrice: number
}

export type Transaction = {
  id: string
  type: TransactionType
  description: string
  amount: number
  items?: TransactionItem[]
  date: string
  responsibleEmployeeId: string
}

export type Production = {
  id: string
  rawProductId: string
  rawQuantity: number
  finishedProductId: string
  finishedQuantity: number
  date: string
  responsibleEmployeeId: string
  notes?: string
}

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'ALPHA'

export type MeetingAttendance = {
  name: string
  status: AttendanceStatus
}

export type Meeting = {
  id: string
  title: string
  activities?: string
  startAt: string
  endAt?: string
  location: string
  attendance: MeetingAttendance[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type AppSettings = {
  cashOpeningBalance: number
}

export type AppData = {
  employees: Employee[]
  products: Product[]
  stockMovements: StockMovement[]
  transactions: Transaction[]
  productions: Production[]
  meetings: Meeting[]
  settings: AppSettings
}
