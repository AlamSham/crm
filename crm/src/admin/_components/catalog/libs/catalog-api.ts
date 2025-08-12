import type { CatalogItem, CatalogCategory, PaginationInfo, CatalogFile } from '../types/catalog'

// Helper to get adminId from localStorage (aligns with follow-up API)
const getAdminId = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminId') || ''
  }
  return ''
}

const API_URL = import.meta.env.VITE_API_URL || 'https://crm-e68t.onrender.com'

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const adminId = getAdminId()
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Admin-ID': adminId, ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const catalogApi = {
  // Categories
  async createCategory(payload: { name: string; description?: string }) {
    const data = await http<{ success: boolean; data: CatalogCategory }>(`/api/catalog/categories`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return data.data
  },
  async getCategories() {
    const data = await http<{ success: boolean; data: CatalogCategory[] }>(`/api/catalog/categories`)
    return data.data
  },
  async updateCategory(id: string, payload: Partial<CatalogCategory>) {
    const data = await http<{ success: boolean; data: CatalogCategory }>(`/api/catalog/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return data.data
  },
  async deleteCategory(id: string) {
    await http<{ success: boolean; message: string }>(`/api/catalog/categories/${id}`, { method: 'DELETE' })
  },

  // Items
  async createItem(payload: Partial<CatalogItem>) {
    const data = await http<{ success: boolean; data: CatalogItem }>(`/api/catalog/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return data.data
  },
  async getItems(params: { page?: number; limit?: number; search?: string; categoryId?: string; status?: string } = {}) {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.search) qs.set('search', params.search)
    if (params.categoryId) qs.set('categoryId', params.categoryId)
    if (params.status) qs.set('status', params.status)
    const data = await http<{ success: boolean; items: CatalogItem[]; pagination: PaginationInfo }>(
      `/api/catalog/items?${qs.toString()}`,
    )
    return data
  },
  async getItem(id: string) {
    const data = await http<{ success: boolean; data: CatalogItem }>(`/api/catalog/items/${id}`)
    return data.data
  },
  async updateItem(id: string, payload: Partial<CatalogItem>) {
    const data = await http<{ success: boolean; data: CatalogItem }>(`/api/catalog/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return data.data
  },
  async deleteItem(id: string) {
    await http<{ success: boolean; message: string }>(`/api/catalog/items/${id}`, { method: 'DELETE' })
  },

  async uploadImage(file: File) {
    const adminId = getAdminId()
    const form = new FormData()
    form.append('image', file)
    const res = await fetch(`${API_URL}/api/catalog/upload/image`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: { 'X-Admin-ID': adminId },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || `Upload failed: ${res.status}`)
    }
    const data = await res.json()
    return data.data as { publicId?: string; url: string; width?: number; height?: number; format?: string }
  },

  async uploadFile(file: File) {
    const adminId = getAdminId()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_URL}/api/catalog/upload/file`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: { 'X-Admin-ID': adminId },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || `Upload failed: ${res.status}`)
    }
    const data = await res.json()
    return data.data as CatalogFile
  },
}
