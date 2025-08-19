import axiosInstance from '@/lib/axiosInstance'
import merchAxios from '@/lib/merchAxios'
import type {
  Customer,
  CustomerListResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/admin/_components/types/customer'

const getClient = () => {
  const merchToken = typeof window !== 'undefined' ? localStorage.getItem('merchAccessToken') : null
  return merchToken ? merchAxios : axiosInstance
}

export const customerService = {
  async list(params?: { q?: string; page?: number; limit?: number }) {
    const client = getClient()
    const res = await client.get<CustomerListResponse>('/customers', {
      params,
    })
    return res.data
  },

  async get(id: string) {
    const client = getClient()
    const res = await client.get<Customer>(`/customers/${id}`)
    return res.data
  },

  async create(input: CreateCustomerInput) {
    const client = getClient()
    const res = await client.post<Customer>('/customers', input)
    return res.data
  },

  async update(input: UpdateCustomerInput) {
    const { id, ...payload } = input
    const client = getClient()
    const res = await client.put<Customer>(`/customers/${id}`, payload)
    return res.data
  },

  async remove(id: string) {
    const client = getClient()
    const res = await client.delete<{ message: string }>(`/customers/${id}`)
    return res.data
  },

  async uploadExcel(file: File) {
    const client = getClient()
    const fd = new FormData()
    fd.append('file', file)
    const res = await client.post<{ message: string; result: any }>(
      '/customers/upload-excel',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },
}
