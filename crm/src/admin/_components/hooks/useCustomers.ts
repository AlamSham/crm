import { useCustomerStore } from '@/admin/_components/store/useCustomerStore'

export const useCustomers = () => {
  const state = useCustomerStore()
  return {
    items: state.items,
    total: state.total,
    page: state.page,
    limit: state.limit,
    loading: state.loading,
    query: state.query,

    setQuery: state.setQuery,
    setPage: state.setPage,
    setLimit: state.setLimit,

    fetch: state.fetch,
    create: state.create,
    update: state.update,
    remove: state.remove,
    uploadExcel: state.uploadExcel,
  }
}
