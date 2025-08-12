export interface CatalogImage {
  publicId?: string
  url: string
  width?: number
  height?: number
  format?: string
}

export interface CatalogItem {
  _id: string
  userId: string
  title: string
  description?: string
  price?: number
  url?: string
  images: CatalogImage[]
  categoryIds: string[]
  tags: string[]
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface CatalogCategory {
  _id: string
  userId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}
