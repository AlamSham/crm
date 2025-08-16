import axiosInstance from '@/lib/axiosInstance'
import type {
  Customer,
  CustomerListResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/admin/_components/types/customer'

export const customerService = {
  async list(params?: { q?: string; page?: number; limit?: number }) {
    const res = await axiosInstance.get<CustomerListResponse>('/customers', {
      params,
    })
    return res.data
  },

  async get(id: string) {
    const res = await axiosInstance.get<Customer>(`/customers/${id}`)
    return res.data
  },

  async create(input: CreateCustomerInput) {
    const res = await axiosInstance.post<Customer>('/customers', input)
    return res.data
  },

  async update(input: UpdateCustomerInput) {
    const { id, ...payload } = input
    const res = await axiosInstance.put<Customer>(`/customers/${id}`, payload)
    return res.data
  },

  async remove(id: string) {
    const res = await axiosInstance.delete<{ message: string }>(`/customers/${id}`)
    return res.data
  },

  async uploadExcel(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await axiosInstance.post<{ message: string; result: any }>(
      '/customers/upload-excel',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },
}
