import { create } from 'zustand'
import { userService } from '@/admin/_components/services/userService'
import type { User, CreateUserInput, UpdateUserInput } from '@/admin/_components/types/user'

interface UserState {
  users: User[]
  total: number
  page: number
  limit: number
  loading: boolean
  query: string
  setQuery: (q: string) => void

  fetchUsers: () => Promise<void>
  createUser: (input: CreateUserInput) => Promise<User | null>
  updateUser: (input: UpdateUserInput) => Promise<User | null>
  deleteUser: (id: string) => Promise<boolean>
  toggleActive: (id: string) => Promise<User | null>
  grantLeadAccess: (id: string) => Promise<User | null>
  revokeLeadAccess: (id: string) => Promise<User | null>
  grantCatalogAccess: (id: string) => Promise<User | null>
  revokeCatalogAccess: (id: string) => Promise<User | null>
  grantTemplateAccess: (id: string) => Promise<User | null>
  revokeTemplateAccess: (id: string) => Promise<User | null>
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  query: '',
  setQuery: (q) => set({ query: q }),

  fetchUsers: async () => {
    const { query, limit } = get()
    set({ loading: true })
    try {
      const res = await userService.list(query)
      set({ users: res.items, total: res.total, page: res.page, limit: res.limit })
    } finally {
      set({ loading: false })
    }
  },

  createUser: async (input) => {
    // Do not swallow Axios errors. Propagate so UI can handle 409 (email exists).
    const created = await userService.create(input)
    set((s) => ({ users: [created, ...s.users], total: s.total + 1 }))
    return created
  },

  updateUser: async (input) => {
    try {
      const updated = await userService.update(input)
      set((s) => ({ users: s.users.map((u) => (u._id === updated._id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },

  deleteUser: async (id) => {
    try {
      await userService.remove(id)
      set((s) => ({ users: s.users.filter((u) => u._id !== id), total: Math.max(0, s.total - 1) }))
      return true
    } catch {
      return false
    }
  },

  toggleActive: async (id) => {
    try {
      const updated = await userService.toggleActive(id)
      set((s) => ({ users: s.users.map((u) => (u._id === id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },


  grantLeadAccess: async (id) => {
    try {
      const updated = await userService.grantLeadAccess(id)
      set((s) => ({ users: s.users.map((u) => (u._id === id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },
  revokeLeadAccess: async (id) => {
    try {
      const updated = await userService.revokeLeadAccess(id)
      set((s) => ({ users: s.users.map((u) => (u._id === id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },
  grantCatalogAccess: async (id) => {
    try {
      const updated = await userService.grantCatalogAccess(id)
      set((s) => ({ users: s.users.map((u) => (u._id === id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },
  revokeCatalogAccess: async (id) => {
    try {
      const updated = await userService.revokeCatalogAccess(id)
      set((s) => ({ users: s.users.map((u) => (u._id === id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },
  grantTemplateAccess: async (id) => {
    try {
      const updated = await userService.grantTemplateAccess(id)
      set((s) => ({ users: s.users.map((u) => (u._id === id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },
  revokeTemplateAccess: async (id) => {
    try {
      const updated = await userService.revokeTemplateAccess(id)
      set((s) => ({ users: s.users.map((u) => (u._id === id ? updated : u)) }))
      return updated
    } catch {
      return null
    }
  },
}))
