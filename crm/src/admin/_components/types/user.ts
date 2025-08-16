export type UserRole = 'Admin' | 'Merchandiser'

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  active: boolean
  lastLogin?: string
  isFollowUpPerson?: boolean
}

export interface UserListResponse {
  items: User[]
  total: number
  page: number
  limit: number
}

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
  active?: boolean
  avatarFile?: File | null
  password: string
  isFollowUpPerson?: boolean
}

export interface UpdateUserInput {
  id: string
  name?: string
  role?: UserRole
  active?: boolean
  avatarFile?: File | null
  password?: string
  isFollowUpPerson?: boolean
}
