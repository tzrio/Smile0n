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
}

export type TransactionType = 'PURCHASE' | 'SALE'

export type Transaction = {
  id: string
  type: TransactionType
  description: string
  amount: number
  date: string
  responsibleEmployeeId: string
}

export type AppSettings = {
  cashOpeningBalance: number
}

export type AppData = {
  employees: Employee[]
  products: Product[]
  stockMovements: StockMovement[]
  transactions: Transaction[]
  settings: AppSettings
}
