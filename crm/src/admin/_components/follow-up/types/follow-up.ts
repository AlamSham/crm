export interface Campaign {
  _id: string
  name: string
  description?: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'paused'
  template: string
  contacts: string[]
  contactLists: string[]
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  sendType: 'immediate' | 'scheduled' | 'sequence'
  sequence?: {
    initialDelay: number // hours
    followupDelays: number[] // hours between followups
    maxFollowups: number
    conditions: {
      openEmail: boolean
      clickLink: boolean
      replyEmail: boolean
    }
  }
  stats: {
    totalSent: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Contact {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained'
  engagementScore: number
  tags: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface ContactList {
  _id: string
  name: string
  description?: string
  contacts: Contact[]
  totalContacts: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Template {
  _id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  type: 'initial' | 'followup1' | 'followup2' | 'followup3'
  isActive: boolean
  variables: string[]
  selectedCatalogItemIds?: string[]
  catalogLayout?: 'grid2' | 'grid3' | 'list'
  showPrices?: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface FollowUp {
  _id: string
  campaignId: string
  contactId: string
  templateId: string
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced'
  sentAt?: Date
  openedAt?: Date
  clickedAt?: Date
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Email {
  _id: string
  to: string
  subject: string
  htmlContent: string
  textContent: string
  status: 'pending' | 'sent' | 'delivered' | 'bounced'
  sentAt?: Date
  deliveredAt?: Date
  userId: string
  createdAt: Date
}

export interface EmailTracking {
  _id: string
  emailId: string
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  userId: string
}

export type FollowUpSection = 'dashboard' | 'campaigns' | 'templates' | 'contacts' | 'contact-lists' | 'catalog-items'

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: PaginationInfo
}

export interface CreateCampaignData {
  name: string
  description?: string
  template: string
  contacts?: string[]
  contactLists?: string[]
  sendType: 'immediate' | 'scheduled' | 'sequence'
  scheduledAt?: Date
  sequence?: {
    initialDelay: number
    followupDelays: number[]
    maxFollowups: number
    conditions: {
      openEmail: boolean
      clickLink: boolean
      replyEmail: boolean
    }
  }
}

export interface CreateContactData {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  tags?: string[]
}

export interface CreateTemplateData {
  name: string
  subject: string
  htmlContent: string
  textContent: string
  type: 'initial' | 'followup1' | 'followup2' | 'followup3'
  isActive?: boolean
  variables?: string[]
  selectedCatalogItemIds?: string[]
  catalogLayout?: 'grid2' | 'grid3' | 'list'
  showPrices?: boolean
}

export interface CreateContactListData {
  name: string
  description?: string
  contacts?: string[]
  totalContacts?: number
} 