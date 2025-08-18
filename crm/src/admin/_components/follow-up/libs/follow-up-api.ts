import axiosInstance from "@/lib/axiosInstance"
import type {
  Campaign,
  Contact,
  ContactList,
  Template,
  FollowUp,
  CreateCampaignData,
  CreateContactData,
  CreateTemplateData,
  CreateContactListData,
  ApiResponse,
  PaginationInfo,
} from "../types/follow-up"

// Helper function to get adminId from localStorage
const getAdminId = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminId") || ""
  }
  return ""
}

// Campaign API
export const campaignApi = {
  create: async (data: CreateCampaignData): Promise<Campaign> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<Campaign>>("/api/followup/campaigns", data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  getAll: async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
  ): Promise<{ campaigns: Campaign[]; pagination: PaginationInfo }> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<Campaign[]>>(`/api/followup/campaigns`, {
      params: { page, limit, search, status },
      headers: { "X-Admin-ID": adminId },
    })
    return {
      campaigns: response.data.data,
      pagination: response.data.pagination!,
    }
  },

  getById: async (id: string): Promise<Campaign> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<Campaign>>(`/api/followup/campaigns/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  update: async (id: string, data: Partial<CreateCampaignData>): Promise<Campaign> => {
    const adminId = getAdminId()
    const response = await axiosInstance.put<ApiResponse<Campaign>>(`/api/followup/campaigns/${id}`, data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    const adminId = getAdminId()
    await axiosInstance.delete(`/api/followup/campaigns/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
  },

  start: async (id: string): Promise<Campaign> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<Campaign>>(`/api/followup/campaigns/${id}/start`, {}, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  pause: async (id: string): Promise<Campaign> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<Campaign>>(`/api/followup/campaigns/${id}/pause`, {}, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },
}

// Contact API
export const contactApi = {
  create: async (data: CreateContactData): Promise<Contact> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<Contact>>("/api/followup/contacts", data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  getAll: async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
    listId = "",
  ): Promise<{ contacts: Contact[]; pagination: PaginationInfo }> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<Contact[]>>(`/api/followup/contacts`, {
      params: { page, limit, search, status, listId },
      headers: { "X-Admin-ID": adminId },
    })
    return {
      contacts: response.data.data,
      pagination: response.data.pagination!,
    }
  },

  getById: async (id: string): Promise<Contact> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<Contact>>(`/api/followup/contacts/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  update: async (id: string, data: Partial<CreateContactData>): Promise<Contact> => {
    const adminId = getAdminId()
    const response = await axiosInstance.put<ApiResponse<Contact>>(`/api/followup/contacts/${id}`, data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    const adminId = getAdminId()
    await axiosInstance.delete(`/api/followup/contacts/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
  },

  bulkCreate: async (contacts: CreateContactData[]): Promise<Contact[]> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<Contact[]>>("/api/followup/contacts/bulk", {
      contacts: contacts,
    }, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },
}

// Contact List API
export const contactListApi = {
  create: async (data: CreateContactListData): Promise<ContactList> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<ContactList>>("/api/followup/contact-lists", data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  getAll: async (
    page = 1,
    limit = 10,
    search = "",
  ): Promise<{ contactLists: ContactList[]; pagination: PaginationInfo }> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<ContactList[]>>(`/api/followup/contact-lists`, {
      params: { page, limit, search },
      headers: { "X-Admin-ID": adminId },
    })
    return {
      contactLists: response.data.data,
      pagination: response.data.pagination!,
    }
  },

  getById: async (id: string): Promise<ContactList> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<ContactList>>(`/api/followup/contact-lists/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  update: async (id: string, data: Partial<CreateContactListData>): Promise<ContactList> => {
    const adminId = getAdminId()
    const response = await axiosInstance.put<ApiResponse<ContactList>>(`/api/followup/contact-lists/${id}`, data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    const adminId = getAdminId()
    await axiosInstance.delete(`/api/followup/contact-lists/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
  },

  addContacts: async (listId: string, contactIds: string[]): Promise<ContactList> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<ContactList>>(
      `/api/followup/contact-lists/${listId}/contacts`,
      {
        contactIds,
      },
      {
        headers: { "X-Admin-ID": adminId },
      },
    )
    return response.data.data
  },

  removeContact: async (listId: string, contactId: string): Promise<ContactList> => {
    const adminId = getAdminId()
    const response = await axiosInstance.delete<ApiResponse<ContactList>>(
      `/api/followup/contact-lists/${listId}/contacts/${contactId}`,
      {
        headers: { "X-Admin-ID": adminId },
      },
    )
    return response.data.data
  },
}

// Template API
export const templateApi = {
  create: async (data: CreateTemplateData): Promise<Template> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<Template>>("/api/followup/templates", data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  getAll: async (
    page = 1,
    limit = 10,
    search = "",
    type = "",
  ): Promise<{ templates: Template[]; pagination: PaginationInfo }> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<Template[]>>(`/api/followup/templates`, {
      params: { page, limit, search, type },
      headers: { "X-Admin-ID": adminId },
    })
    return {
      templates: response.data.data,
      pagination: response.data.pagination!,
    }
  },

  getById: async (id: string): Promise<Template> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<Template>>(`/api/followup/templates/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  update: async (id: string, data: Partial<CreateTemplateData>): Promise<Template> => {
    const adminId = getAdminId()
    const response = await axiosInstance.put<ApiResponse<Template>>(`/api/followup/templates/${id}`, data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  approve: async (id: string): Promise<Template> => {
    const adminId = getAdminId()
    const response = await axiosInstance.patch<ApiResponse<Template>>(
      `/api/followup/templates/${id}/approve`,
      {},
      {
        headers: { "X-Admin-ID": adminId },
      },
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    const adminId = getAdminId()
    await axiosInstance.delete(`/api/followup/templates/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
  },
}

// Follow-up API
export const followUpApi = {
  create: async (data: any): Promise<FollowUp> => {
    const adminId = getAdminId()
    const response = await axiosInstance.post<ApiResponse<FollowUp>>("/api/followup/followups", data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  getAll: async (
    page = 1,
    limit = 10,
    status = "",
    campaignId = "",
  ): Promise<{ followUps: FollowUp[]; pagination: PaginationInfo }> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<FollowUp[]>>(`/api/followup/followups`, {
      params: { page, limit, status, campaignId },
      headers: { "X-Admin-ID": adminId },
    })
    return {
      followUps: response.data.data,
      pagination: response.data.pagination!,
    }
  },

  getById: async (id: string): Promise<FollowUp> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<FollowUp>>(`/api/followup/followups/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  update: async (id: string, data: any): Promise<FollowUp> => {
    const adminId = getAdminId()
    const response = await axiosInstance.put<ApiResponse<FollowUp>>(`/api/followup/followups/${id}`, data, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    const adminId = getAdminId()
    await axiosInstance.delete(`/api/followup/followups/${id}`, {
      headers: { "X-Admin-ID": adminId },
    })
  },

  getByCampaign: async (campaignId: string): Promise<FollowUp[]> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<FollowUp[]>>(
      `/api/followup/followups/campaign/${campaignId}`,
      {
        headers: { "X-Admin-ID": adminId },
      },
    )
    return response.data.data
  },
}

// Analytics API
export const analyticsApi = {
  getCampaignStats: async (campaignId: string): Promise<any> => {
    const adminId = getAdminId()
    const response = await axiosInstance.get<ApiResponse<any>>(`/api/followup/campaigns/${campaignId}/stats`, {
      headers: { "X-Admin-ID": adminId },
    })
    return response.data.data
  },
}
