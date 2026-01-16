export type Role = 'CEO' | 'CTO' | 'CMO' | 'PENDING'

export type User = {
  id: string
  email: string
  name: string
  role: Role
  avatarDataUrl?: string
}
