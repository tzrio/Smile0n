import type { AppData, Employee, Product, ProductKind, StockMovement, Transaction } from '../types'
import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/apiClient'
import { apiPaths } from '../../api/apiPaths'

type Update<T> = Partial<Omit<T, 'id' | 'createdAt'>>

export const apiRepo = {
  async getAll(): Promise<AppData> {
    return apiGet<AppData>(apiPaths.appData)
  },

  employees: {
    async create(input: { name: string; position: string }): Promise<Employee> {
      return apiPost<Employee>(apiPaths.employees, input)
    },
    async update(id: string, patch: Update<Employee>): Promise<Employee> {
      return apiPatch<Employee>(apiPaths.employee(id), patch)
    },
  },

  products: {
    async create(input: { name: string; category: string; kind: ProductKind }): Promise<Product> {
      return apiPost<Product>(apiPaths.products, input)
    },
    async update(id: string, patch: Update<Product>): Promise<Product> {
      return apiPatch<Product>(apiPaths.product(id), patch)
    },
    async remove(id: string): Promise<void> {
      await apiDelete<void>(apiPaths.product(id))
    },
  },

  stockMovements: {
    async create(input: Omit<StockMovement, 'id'>): Promise<StockMovement> {
      return apiPost<StockMovement>(apiPaths.stockMovements, input)
    },
  },

  transactions: {
    async create(input: Omit<Transaction, 'id'>): Promise<Transaction> {
      return apiPost<Transaction>(apiPaths.transactions, input)
    },
  },

  settings: {
    async setCashOpeningBalance(cashOpeningBalance: number) {
      return apiPatch(apiPaths.settings, { cashOpeningBalance })
    },
  },
}
