const followupService = require("../services/followupService")
const Contact = require("../models/follow-up/Contact")
const logger = require("../utils/logger")

// Campaign Controllers
async function createCampaign(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const campaignData = {
      ...req.body,
      userId
    }

    const campaign = await followupService.createCampaign(campaignData)

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign
    })
  } catch (error) {
    logger.error("Error creating campaign:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message
    })
  }
}

async function getCampaigns(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { page = 1, limit = 10, search = "", status = "" } = req.query

    const result = await followupService.getCampaigns(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.toString(),
      status: status.toString()
    })

    res.json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination
    })
  } catch (error) {
    logger.error("Error fetching campaigns:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message
    })
  }
}

async function getCampaignById(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { campaignId } = req.params

    const campaign = await followupService.getCampaignById(campaignId, userId)

    res.json({
      success: true,
      data: campaign
    })
  } catch (error) {
    logger.error("Error fetching campaign:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign",
      error: error.message
    })
  }
}

async function updateCampaign(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { campaignId } = req.params
    const updateData = req.body

    const campaign = await followupService.updateCampaign(campaignId, userId, updateData)

    res.json({
      success: true,
      message: "Campaign updated successfully",
      data: campaign
    })
  } catch (error) {
    logger.error("Error updating campaign:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update campaign",
      error: error.message
    })
  }
}

async function deleteCampaign(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { campaignId } = req.params

    const result = await followupService.deleteCampaign(campaignId, userId)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error("Error deleting campaign:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
      error: error.message
    })
  }
}

async function startCampaign(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { campaignId } = req.params

    logger.info(`Controller: Starting campaign ${campaignId} for user ${userId}`)

    if (!userId) {
      logger.error("Missing userId in request")
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      })
    }

    if (!campaignId) {
      logger.error("Missing campaignId in request")
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required"
      })
    }

    const campaign = await followupService.manualStartCampaign(campaignId, userId)

    logger.info(`Campaign ${campaignId} manually started successfully with sendType: ${campaign.sendType}`)

    logger.info(`Campaign ${campaignId} started successfully`)
    
    let message = ""
    if (campaign.sendType === 'immediate') {
      message = "Campaign started and emails are being sent immediately"
    } else if (campaign.sendType === 'scheduled') {
      message = "Campaign scheduled successfully"
    } else if (campaign.sendType === 'sequence') {
      message = "Campaign sequence setup completed"
    }
    
    res.json({
      success: true,
      message: message,
      data: campaign
    })
  } catch (error) {
    logger.error("Error starting campaign:", {
      error: error.message,
      stack: error.stack,
      campaignId: req.params.campaignId,
      userId: req.headers['x-admin-id'] || req.body.adminId
    })
    res.status(500).json({
      success: false,
      message: "Failed to start campaign",
      error: error.message
    })
  }
}

// Contact Controllers
async function createContact(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const contactData = {
      ...req.body,
      userId
    }

    const contact = await followupService.createContact(contactData)

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact
    })
  } catch (error) {
    logger.error("Error creating contact:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create contact",
      error: error.message
    })
  }
}

async function getContacts(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { page = 1, limit = 10, search = "", status = "", listId = "" } = req.query

    const result = await followupService.getContacts(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.toString(),
      status: status.toString(),
      listId: listId.toString()
    })

    res.json({
      success: true,
      data: result.contacts,
      pagination: result.pagination
    })
  } catch (error) {
    logger.error("Error fetching contacts:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: error.message
    })
  }
}

async function updateContact(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { contactId } = req.params
    const updateData = req.body

    const contact = await followupService.updateContact(contactId, userId, updateData)

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact
    })
  } catch (error) {
    logger.error("Error updating contact:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update contact",
      error: error.message
    })
  }
}

async function deleteContact(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { contactId } = req.params

    const result = await followupService.deleteContact(contactId, userId)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error("Error deleting contact:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: error.message
    })
  }
}

// Contact List Controllers
async function createContactList(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const listData = {
      ...req.body,
      userId
    }

    const contactList = await followupService.createContactList(listData)

    res.status(201).json({
      success: true,
      message: "Contact list created successfully",
      data: contactList
    })
  } catch (error) {
    logger.error("Error creating contact list:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create contact list",
      error: error.message
    })
  }
}

async function getContactLists(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { page = 1, limit = 10, search = "" } = req.query

    const result = await followupService.getContactLists(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.toString()
    })

    res.json({
      success: true,
      data: result.contactLists,
      pagination: result.pagination
    })
  } catch (error) {
    logger.error("Error fetching contact lists:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact lists",
      error: error.message
    })
  }
}

async function updateContactList(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { listId } = req.params
    const updateData = req.body

    const contactList = await followupService.updateContactList(listId, userId, updateData)

    res.json({
      success: true,
      message: "Contact list updated successfully",
      data: contactList
    })
  } catch (error) {
    logger.error("Error updating contact list:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update contact list",
      error: error.message
    })
  }
}

async function deleteContactList(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { listId } = req.params

    const result = await followupService.deleteContactList(listId, userId)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error("Error deleting contact list:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete contact list",
      error: error.message
    })
  }
}

// Template Controllers
async function createTemplate(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const templateData = {
      ...req.body,
      userId
    }

    const template = await followupService.createTemplate(templateData)

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template
    })
  } catch (error) {
    logger.error("Error creating template:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create template",
      error: error.message
    })
  }
}

async function getTemplates(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { page = 1, limit = 10, search = "", type = "" } = req.query

    const result = await followupService.getTemplates(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.toString(),
      type: type.toString()
    })

    res.json({
      success: true,
      data: result.templates,
      pagination: result.pagination
    })
  } catch (error) {
    logger.error("Error fetching templates:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message
    })
  }
}

async function updateTemplate(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { templateId } = req.params
    const updateData = req.body

    const template = await followupService.updateTemplate(templateId, userId, updateData)

    res.json({
      success: true,
      message: "Template updated successfully",
      data: template
    })
  } catch (error) {
    logger.error("Error updating template:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update template",
      error: error.message
    })
  }
}

async function deleteTemplate(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { templateId } = req.params

    const result = await followupService.deleteTemplate(templateId, userId)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error("Error deleting template:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete template",
      error: error.message
    })
  }
}

// Follow-up Controllers
async function createFollowup(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const followupData = {
      ...req.body,
      userId
    }

    const followup = await followupService.createFollowup(followupData)

    res.status(201).json({
      success: true,
      message: "Followup created successfully",
      data: followup
    })
  } catch (error) {
    logger.error("Error creating followup:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create followup",
      error: error.message
    })
  }
}

async function getFollowups(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { page = 1, limit = 10, status = "", campaignId = "" } = req.query

    const result = await followupService.getFollowups(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status: status.toString(),
      campaignId: campaignId.toString()
    })

    res.json({
      success: true,
      data: result.followups,
      pagination: result.pagination
    })
  } catch (error) {
    logger.error("Error fetching followups:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch followups",
      error: error.message
    })
  }
}

async function updateFollowup(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { followupId } = req.params
    const updateData = req.body

    const followup = await followupService.updateFollowup(followupId, userId, updateData)

    res.json({
      success: true,
      message: "Followup updated successfully",
      data: followup
    })
  } catch (error) {
    logger.error("Error updating followup:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update followup",
      error: error.message
    })
  }
}

async function deleteFollowup(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { followupId } = req.params

    const result = await followupService.deleteFollowup(followupId, userId)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error("Error deleting followup:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete followup",
      error: error.message
    })
  }
}

// Analytics Controllers
async function getCampaignStats(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { campaignId } = req.params

    const stats = await followupService.getCampaignStats(campaignId, userId)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error("Error fetching campaign stats:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign stats",
      error: error.message
    })
  }
}

// Bulk Operations
async function bulkCreateContacts(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { contacts } = req.body

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Contacts array is required"
      })
    }

    const createdContacts = []
    const errors = []

    for (const contactData of contacts) {
      try {
        const contact = await followupService.createContact({
          ...contactData,
          userId
        })
        createdContacts.push(contact)
      } catch (error) {
        errors.push({
          email: contactData.email,
          error: error.message
        })
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdContacts.length} contacts successfully`,
      data: {
        created: createdContacts,
        errors: errors
      }
    })
  } catch (error) {
    logger.error("Error bulk creating contacts:", error)
    res.status(500).json({
      success: false,
      message: "Failed to bulk create contacts",
      error: error.message
    })
  }
}

async function bulkAddContactsToList(req, res) {
  try {
    const userId = req.headers['x-admin-id'] || req.body.adminId
    const { listId } = req.params
    const { contactIds } = req.body

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Contact IDs array is required"
      })
    }

    // Add contacts to list
    await followupService.updateContactList(listId, userId, {
      $addToSet: { contacts: { $each: contactIds } }
    })

    // Update contacts with list ID
    await Contact.updateMany(
      { _id: { $in: contactIds }, userId },
      { $addToSet: { listIds: listId } }
    )

    res.json({
      success: true,
      message: "Contacts added to list successfully"
    })
  } catch (error) {
    logger.error("Error adding contacts to list:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add contacts to list",
      error: error.message
    })
  }
}

// Process Scheduled Followups (Admin endpoint)
async function processFollowups(req, res) {
  try {
    await followupService.processScheduledFollowups()

    res.json({
      success: true,
      message: "Scheduled followups processed successfully"
    })
  } catch (error) {
    logger.error("Error processing followups:", error)
    res.status(500).json({
      success: false,
      message: "Failed to process followups",
      error: error.message
    })
  }
}

module.exports = {
  // Campaign Controllers
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  startCampaign,

  // Contact Controllers
  createContact,
  getContacts,
  updateContact,
  deleteContact,

  // Contact List Controllers
  createContactList,
  getContactLists,
  updateContactList,
  deleteContactList,

  // Template Controllers
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,

  // Follow-up Controllers
  createFollowup,
  getFollowups,
  updateFollowup,
  deleteFollowup,

  // Analytics Controllers
  getCampaignStats,

  // Bulk Operations
  bulkCreateContacts,
  bulkAddContactsToList,

  // Admin Operations
  processFollowups
} 