import { useMemo } from 'react'
import { useUserStore } from '@/admin/_components/store/useUserStore'
import type { User } from '@/admin/_components/types/user'

export type UserRow = {
  key: string
  user: { name: string; email: string; avatar?: string }
  role: User['role']
  active: boolean
  lastLogin: string
  isLeadAccess?: boolean
  isCatalogAccess?: boolean
  isTemplateAccess?: boolean
}

function toRow(u: User): UserRow {
  return {
    key: u._id,
    user: { name: u.name, email: u.email, avatar: u.avatar },
    role: u.role,
    active: u.active,
    lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '',
    isLeadAccess: (u as any).isLeadAccess,
    isCatalogAccess: (u as any).isCatalogAccess,
    isTemplateAccess: (u as any).isTemplateAccess,
  }
}

export function useUsers() {
  const store = useUserStore()

  const rows = useMemo(() => store.users.map(toRow), [store.users])

  return {
    rows,
    loading: store.loading,
    query: store.query,
    setQuery: store.setQuery,
    fetchUsers: store.fetchUsers,
    createUser: store.createUser,
    updateUser: store.updateUser,
    deleteUser: store.deleteUser,
    toggleActive: store.toggleActive,
    grantLeadAccess: store.grantLeadAccess,
    revokeLeadAccess: store.revokeLeadAccess,
    grantCatalogAccess: store.grantCatalogAccess,
    revokeCatalogAccess: store.revokeCatalogAccess,
    grantTemplateAccess: store.grantTemplateAccess,
    revokeTemplateAccess: store.revokeTemplateAccess,
  }
}
