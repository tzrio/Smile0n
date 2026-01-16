export const apiPaths = {
  appData: '/v1/app-data',
  employees: '/v1/employees',
  employee: (id: string) => `/v1/employees/${id}`,
  products: '/v1/products',
  product: (id: string) => `/v1/products/${id}`,
  stockMovements: '/v1/stock-movements',
  transactions: '/v1/transactions',
  settings: '/v1/settings',
}
