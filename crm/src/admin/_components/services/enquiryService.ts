import axiosInstance from '@/lib/axiosInstance'
import type { CustomerEnquiry, EnquiryListResponse, EnquiryStatus, EnquiryPriority } from '@/admin/_components/types/enquiry'

export const enquiryService = {
  async list(params?: { search?: string; status?: EnquiryStatus; priority?: EnquiryPriority; page?: number; limit?: number }) {
    const res = await axiosInstance.get<EnquiryListResponse>('/enquiries', { params })
    return res.data
  },

  async create(input: Partial<CustomerEnquiry>) {
    const res = await axiosInstance.post<CustomerEnquiry>('/enquiries', input)
    return res.data
  },

  async update(id: string, input: Partial<CustomerEnquiry>) {
    const res = await axiosInstance.put<CustomerEnquiry>(`/enquiries/${id}`, input)
    return res.data
  },

  async convert(id: string) {
    const res = await axiosInstance.post<{ message: string; customer: any }>(`/enquiries/${id}/convert`)
    return res.data
  },
  
  async remove(id: string) {
    const res = await axiosInstance.delete<{ message: string }>(`/enquiries/${id}`)
    return res.data
  },
}
