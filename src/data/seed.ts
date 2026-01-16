import type { AppData } from './types'

export const seedData: AppData = {
  employees: [
    {
      id: 'EMP-0001',
      name: 'Rakha',
      position: 'CEO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'EMP-0002',
      name: 'Roihan',
      position: 'CTO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'EMP-0003',
      name: 'Bagus',
      position: 'CMO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  products: [
    {
      id: 'PRD-0001',
      name: 'Wall Decor Kayu Minimalis',
      category: 'Kayu',
      kind: 'FINISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'PRD-0002',
      name: 'Wall Decor Macrame',
      category: 'Kain',
      kind: 'FINISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  stockMovements: [],
  transactions: [],
  settings: {
    cashOpeningBalance: 0,
  },
}
