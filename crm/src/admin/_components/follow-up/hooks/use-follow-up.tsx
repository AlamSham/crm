"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
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
  FollowUpSection,
  PaginationInfo
} from '../types/follow-up'
import { 
  campaignApi, 
  contactApi, 
  contactListApi, 
  templateApi, 
  followUpApi 
} from '../libs/follow-up-api'

interface FollowUpContextType {
  // State
  campaigns: Campaign[]
  contacts: Contact[]
  contactLists: ContactList[]
  templates: Template[]
  followUps: FollowUp[]
  currentSection: FollowUpSection
  
  // Loading states
  campaignsLoading: boolean
  contactsLoading: boolean
  contactListsLoading: boolean
  templatesLoading: boolean
  followUpsLoading: boolean
  
  // Pagination
  campaignsPagination: PaginationInfo | null
  contactsPagination: PaginationInfo | null
  contactListsPagination: PaginationInfo | null
  templatesPagination: PaginationInfo | null
  followUpsPagination: PaginationInfo | null
  
  // Actions
  setCurrentSection: (section: FollowUpSection) => void
  
  // Campaign actions
  createCampaign: (data: CreateCampaignData) => Promise<Campaign>
  updateCampaign: (id: string, data: Partial<CreateCampaignData>) => Promise<Campaign>
  deleteCampaign: (id: string) => Promise<void>
  startCampaign: (id: string) => Promise<Campaign>
  loadCampaigns: (page?: number, limit?: number) => Promise<void>
  
  // Contact actions
  createContact: (data: CreateContactData) => Promise<Contact>
  updateContact: (id: string, data: Partial<CreateContactData>) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  bulkCreateContacts: (contacts: CreateContactData[]) => Promise<Contact[]>
  loadContacts: (page?: number, limit?: number) => Promise<void>
  
  // Contact List actions
  createContactList: (data: CreateContactListData) => Promise<ContactList>
  updateContactList: (id: string, data: Partial<CreateContactListData>) => Promise<ContactList>
  deleteContactList: (id: string) => Promise<void>
  addContactsToList: (listId: string, contactIds: string[]) => Promise<void>
  loadContactLists: (page?: number, limit?: number) => Promise<void>
  
  // Template actions
  createTemplate: (data: CreateTemplateData) => Promise<Template>
  updateTemplate: (id: string, data: Partial<CreateTemplateData>) => Promise<Template>
  deleteTemplate: (id: string) => Promise<void>
  approveTemplate: (id: string) => Promise<Template>
  loadTemplates: (page?: number, limit?: number) => Promise<void>
  
  // Follow-up actions
  loadFollowUps: (page?: number, limit?: number) => Promise<void>
  loadFollowUpsByCampaign: (campaignId: string) => Promise<FollowUp[]>
}

const FollowUpContext = createContext<FollowUpContextType | undefined>(undefined)

export const useFollowUpContext = () => {
  const context = useContext(FollowUpContext)
  if (!context) {
    throw new Error('useFollowUpContext must be used within a FollowUpProvider')
  }
  return context
}

interface FollowUpProviderProps {
  children: ReactNode
}

export const FollowUpProvider = ({ children }: FollowUpProviderProps) => {
  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [currentSection, setCurrentSection] = useState<FollowUpSection>('dashboard')
  
  // Loading states
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactListsLoading, setContactListsLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [followUpsLoading, setFollowUpsLoading] = useState(false)
  
  // Pagination
  const [campaignsPagination, setCampaignsPagination] = useState<PaginationInfo | null>(null)
  const [contactsPagination, setContactsPagination] = useState<PaginationInfo | null>(null)
  const [contactListsPagination, setContactListsPagination] = useState<PaginationInfo | null>(null)
  const [templatesPagination, setTemplatesPagination] = useState<PaginationInfo | null>(null)
  const [followUpsPagination, setFollowUpsPagination] = useState<PaginationInfo | null>(null)
  
  // Campaign actions
  const createCampaign = useCallback(async (data: CreateCampaignData): Promise<Campaign> => {
    const campaign = await campaignApi.create(data)
    setCampaigns(prev => [campaign, ...prev])
    return campaign
  }, [])
  
  const updateCampaign = useCallback(async (id: string, data: Partial<CreateCampaignData>): Promise<Campaign> => {
    const campaign = await campaignApi.update(id, data)
    setCampaigns(prev => prev.map(c => c._id === id ? campaign : c))
    return campaign
  }, [])
  
  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    await campaignApi.delete(id)
    setCampaigns(prev => prev.filter(c => c._id !== id))
  }, [])
  
  const startCampaign = useCallback(async (id: string): Promise<Campaign> => {
    const campaign = await campaignApi.start(id)
    setCampaigns(prev => prev.map(c => c._id === id ? campaign : c))
    return campaign
  }, [])
  
  const loadCampaigns = useCallback(async (page = 1, limit = 10): Promise<void> => {
    setCampaignsLoading(true)
    try {
      const { campaigns: newCampaigns, pagination } = await campaignApi.getAll(page, limit)
      setCampaigns(newCampaigns)
      setCampaignsPagination(pagination)
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setCampaignsLoading(false)
    }
  }, [])
  
  // Contact actions
  const createContact = useCallback(async (data: CreateContactData): Promise<Contact> => {
    const contact = await contactApi.create(data)
    setContacts(prev => [contact, ...prev])
    return contact
  }, [])
  
  const updateContact = useCallback(async (id: string, data: Partial<CreateContactData>): Promise<Contact> => {
    const contact = await contactApi.update(id, data)
    setContacts(prev => prev.map(c => c._id === id ? contact : c))
    return contact
  }, [])
  
  const deleteContact = useCallback(async (id: string): Promise<void> => {
    await contactApi.delete(id)
    setContacts(prev => prev.filter(c => c._id !== id))
  }, [])
  
  const bulkCreateContacts = useCallback(async (contactsData: CreateContactData[]): Promise<Contact[]> => {
    const newContacts = await contactApi.bulkCreate(contactsData)
    setContacts(prev => [...newContacts, ...prev])
    return newContacts
  }, [])
  
  const loadContacts = useCallback(async (page = 1, limit = 10): Promise<void> => {
    setContactsLoading(true)
    try {
      const { contacts: newContacts, pagination } = await contactApi.getAll(page, limit)
      setContacts(newContacts)
      setContactsPagination(pagination)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setContactsLoading(false)
    }
  }, [])
  
  // Contact List actions
  const createContactList = useCallback(async (data: CreateContactListData): Promise<ContactList> => {
    const contactList = await contactListApi.create(data)
    setContactLists(prev => [contactList, ...prev])
    return contactList
  }, [])
  
  const updateContactList = useCallback(async (id: string, data: Partial<CreateContactListData>): Promise<ContactList> => {
    const contactList = await contactListApi.update(id, data)
    setContactLists(prev => prev.map(cl => cl._id === id ? contactList : cl))
    return contactList
  }, [])
  
  const deleteContactList = useCallback(async (id: string): Promise<void> => {
    await contactListApi.delete(id)
    setContactLists(prev => prev.filter(cl => cl._id !== id))
  }, [])
  
  const loadContactLists = useCallback(async (page = 1, limit = 10): Promise<void> => {
    setContactListsLoading(true)
    try {
      const { contactLists: newContactLists, pagination } = await contactListApi.getAll(page, limit)
      setContactLists(newContactLists)
      setContactListsPagination(pagination)
    } catch (error) {
      console.error('Failed to load contact lists:', error)
    } finally {
      setContactListsLoading(false)
    }
  }, [])
  
  const addContactsToList = useCallback(async (listId: string, contactIds: string[]): Promise<void> => {
    await contactListApi.addContacts(listId, contactIds)
    // Reload the list to reflect changes
    await loadContactLists()
  }, [loadContactLists])
  
  // Template actions
  const createTemplate = useCallback(async (data: CreateTemplateData): Promise<Template> => {
    const template = await templateApi.create(data)
    setTemplates(prev => [template, ...prev])
    return template
  }, [])
  
  const updateTemplate = useCallback(async (id: string, data: Partial<CreateTemplateData>): Promise<Template> => {
    const template = await templateApi.update(id, data)
    setTemplates(prev => prev.map(t => t._id === id ? template : t))
    return template
  }, [])
  
  const approveTemplate = useCallback(async (id: string): Promise<Template> => {
    const template = await templateApi.approve(id)
    setTemplates(prev => prev.map(t => t._id === id ? template : t))
    return template
  }, [])
  
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    await templateApi.delete(id)
    setTemplates(prev => prev.filter(t => t._id !== id))
  }, [])
  
  const loadTemplates = useCallback(async (page = 1, limit = 10): Promise<void> => {
    setTemplatesLoading(true)
    try {
      const { templates: newTemplates, pagination } = await templateApi.getAll(page, limit)
      setTemplates(newTemplates)
      setTemplatesPagination(pagination)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }, [])
  
  // Follow-up actions
  const loadFollowUps = useCallback(async (page = 1, limit = 10): Promise<void> => {
    setFollowUpsLoading(true)
    try {
      const { followUps: newFollowUps, pagination } = await followUpApi.getAll(page, limit)
      setFollowUps(newFollowUps)
      setFollowUpsPagination(pagination)
    } catch (error) {
      console.error('Failed to load follow-ups:', error)
    } finally {
      setFollowUpsLoading(false)
    }
  }, [])
  
  const loadFollowUpsByCampaign = useCallback(async (campaignId: string): Promise<FollowUp[]> => {
    try {
      const { followUps } = await followUpApi.getAll(1, 100, "", campaignId)
      return followUps
    } catch (error) {
      console.error('Failed to load follow-ups by campaign:', error)
      return []
    }
  }, [])
  
  // Load initial data based on current section
  useEffect(() => {
    switch (currentSection) {
      case 'dashboard':
        loadCampaigns()
        loadContacts()
        loadTemplates()
        loadContactLists()
        break
      case 'campaigns':
        loadCampaigns()
        break
      case 'contacts':
        loadContacts()
        break
      case 'templates':
        loadTemplates()
        break
      case 'contact-lists':
        loadContactLists()
        break
    }
  }, [currentSection, loadCampaigns, loadContacts, loadTemplates, loadContactLists])
  
  const value: FollowUpContextType = {
    // State
    campaigns,
    contacts,
    contactLists,
    templates,
    followUps,
    currentSection,
    
    // Loading states
    campaignsLoading,
    contactsLoading,
    contactListsLoading,
    templatesLoading,
    followUpsLoading,
    
    // Pagination
    campaignsPagination,
    contactsPagination,
    contactListsPagination,
    templatesPagination,
    followUpsPagination,
    
    // Actions
    setCurrentSection,
    
    // Campaign actions
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    loadCampaigns,
    
    // Contact actions
    createContact,
    updateContact,
    deleteContact,
    bulkCreateContacts,
    loadContacts,
    
    // Contact List actions
    createContactList,
    updateContactList,
    deleteContactList,
    addContactsToList,
    loadContactLists,
    
    // Template actions
    createTemplate,
    updateTemplate,
    deleteTemplate,
    approveTemplate,
    loadTemplates,
    
    // Follow-up actions
    loadFollowUps,
    loadFollowUpsByCampaign,
  }
  
  return (
    <FollowUpContext.Provider value={value}>
      {children}
    </FollowUpContext.Provider>
  )
} 