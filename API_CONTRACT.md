# API Contract (Draft)

Dokumen ini mendeskripsikan kontrak endpoint yang diharapkan oleh UI.

Catatan:
- Semua request/response menggunakan JSON.
- Semua tanggal menggunakan ISO-8601 string (contoh: `2026-01-15T10:20:30.000Z`).
- Auth pada project ini saat ini masih mock di sisi UI. Saat backend siap, tambahkan auth token (Bearer) pada request.

## Data Models

Model mengikuti `src/data/types.ts`:
- Employee
- Product
- StockMovement
- Transaction
- AppSettings
- AppData

## Endpoints

### GET /v1/app-data
Mengambil semua data awal untuk dashboard.

Response: `AppData`

### POST /v1/employees
Body:
```json
{ "name": "string", "position": "string" }
```
Response: `Employee`

### PATCH /v1/employees/{id}
Body (partial):
```json
{ "name": "string", "position": "string" }
```
Response: `Employee`

### POST /v1/products
Body:
```json
{ "name": "string", "category": "string" }
```
Response: `Product`

### POST /v1/stock-movements
Body:
```json
{
  "productId": "string",
  "type": "IN" | "OUT",
  "quantity": 123,
  "date": "2026-01-15T10:20:30.000Z",
  "responsibleEmployeeId": "string"
}
```
Response: `StockMovement`

### POST /v1/transactions
Body:
```json
{
  "type": "PURCHASE" | "SALE",
  "description": "string",
  "amount": 123000,
  "date": "2026-01-15T10:20:30.000Z",
  "responsibleEmployeeId": "string"
}
```
Response: `Transaction`

### PATCH /v1/settings
Body:
```json
{ "cashOpeningBalance": 0 }
```
Response: `AppSettings`
