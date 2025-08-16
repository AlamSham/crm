import { useMemo } from 'react'
import { useUserStore } from '@/admin/_components/store/useUserStore'
import type { User } from '@/admin/_components/types/user'

export type UserRow = {
  key: string
  user: { name: string; email: string; avatar?: string }
  role: User['role']
  active: boolean
  lastLogin: string
  isFollowUpPerson?: boolean
  isEmailAccess?: boolean
}

function toRow(u: User): UserRow {
  return {
    key: u._id,
    user: { name: u.name, email: u.email, avatar: u.avatar },
    role: u.role,
    active: u.active,
    lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '',
    isFollowUpPerson: u.isFollowUpPerson,
    isEmailAccess: (u as any).isEmailAccess,
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
    grantFollowUp: store.grantFollowUp,
    grantEmailAccess: store.grantEmailAccess,
    revokeFollowUp: store.revokeFollowUp,
    revokeEmailAccess: store.revokeEmailAccess,
  }
}
