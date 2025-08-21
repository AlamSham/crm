const Followup = require("../models/follow-up/Followup")
const Campaign = require("../models/follow-up/Campaign")
const Contact = require("../models/follow-up/Contact")
const ContactList = require("../models/follow-up/ContactList")
const Template = require("../models/follow-up/Template")
const Email = require("../models/follow-up/Email")
const EmailTracking = require("../models/follow-up/EmailTracking")
const Unsubscribe = require("../models/follow-up/Unsubscribe")
const emailService = require("./emailService")
const logger = require("../utils/logger")
const CatalogItem = require("../models/catalog/CatalogItem")
const Admin = require("../models/admin")
const User = require("../models/user")
const { decrypt } = require("../utils/crypto")
const envEmail = require("../config/emailConfig")

// Simple variable replacement for templates
function replaceVariables(str = "", contact = {}, fromAddress = "") {
  if (!str) return ""
  const name = contact.firstName || contact.name || (contact.email ? contact.email.split('@')[0] : "")
  const company = contact.company || ""
  const domain = (fromAddress.split('@')[1] || '').split('.')[0] || 'OurCompany'
  const senderCompany = domain.charAt(0).toUpperCase() + domain.slice(1)
  const senderName = senderCompany
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const unsubscribeLink = `${clientUrl}/unsubscribe?email=${encodeURIComponent(contact.email || '')}`
  return str
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{senderName\}\}/g, senderName)
    .replace(/\{\{senderCompany\}\}/g, senderCompany)
    .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeLink)
}

// Resolve effective email config for a given userId (admin or merchant)
async function resolveEmailConfigByUserId(userId) {
  // Defaults from env
  const base = {
    user: envEmail.user,
    password: envEmail.password,
    imapHost: envEmail.imapHost,
    imapPort: envEmail.imapPort,
    smtpHost: envEmail.smtpHost,
    smtpPort: envEmail.smtpPort,
    fromName: undefined,
  }

  if (!userId) return base

  let doc = await Admin.findById(userId).select('emailSettings')
  if (!doc) {
    doc = await User.findById(userId).select('emailSettings')
  }
  const s = doc?.emailSettings
  if (s && s.enabled !== false && s.user) {
    return {
      user: s.user || base.user,
      password: s.passwordEnc ? decrypt(s.passwordEnc) : base.password,
      imapHost: s.imapHost || base.imapHost,
      imapPort: s.imapPort || base.imapPort,
      smtpHost: s.smtpHost || base.smtpHost,
      smtpPort: s.smtpPort || base.smtpPort,
      fromName: s.fromName,
    }
  }

  return base
}

// Admin: list templates across all users (no userId filter)
async function getAllTemplates({ page = 1, limit = 10, search = "", type = "", isActive = undefined, approvedOnly = false }) {
  try {
    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ]
    }
    if (type) {
      query.type = type
    }
    if (typeof isActive === 'boolean') {
      query.isActive = isActive
    }
    if (approvedOnly) {
      query.approvedAt = { $ne: null }
    }

    const templates = await Template.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Template.countDocuments(query)

    return {
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    logger.error("Error fetching all templates:", error)
    throw error
  }
}

// Send queued Emails whose scheduledAt is due
async function processDueEmails() {
  try {
    const now = new Date()
    const dueEmails = await Email.find({
      status: 'queued',
      scheduledAt: { $lte: now },
    }).populate('templateId contactId campaignId')

    for (const email of dueEmails) {
      try {
        const template = email.templateId
        const contact = email.contactId
        if (!template || !contact) {
          email.status = 'failed'
          await email.save()
          continue
        }

        const computedHtml = await buildEmailHtmlWithCatalog(template)
        const computedText = await buildEmailTextWithCatalog(template)
        // Resolve per-user email config using the email's userId
        const cfg = await resolveEmailConfigByUserId(email.userId || email.user)
        const finalHtml = replaceVariables(computedHtml, contact, cfg.user || '')
        const finalText = replaceVariables(computedText, contact, cfg.user || '')

        // update contents before sending
        email.htmlContent = finalHtml
        email.textContent = finalText

        const result = await emailService.sendEmail({
          to: contact.email,
          subject: email.subject,
          text: finalText,
          html: finalHtml || undefined,
        }, cfg)

        email.status = 'sent'
        email.sentAt = new Date()
        email.messageId = result.messageId
        // Generate and set tracking pixel id to satisfy EmailTracking schema
        const trackingPixelId = `track_${email._id}_${Date.now()}`
        email.trackingPixelId = trackingPixelId
        await email.save()

        // tracking doc
        const tracking = new EmailTracking({
          emailId: email._id,
          campaignId: email.campaignId?._id || email.campaignId,
          contactId: contact._id,
          trackingPixelId: trackingPixelId,
        })
        await tracking.save()
      } catch (err) {
        logger.error('Error sending due email:', { emailId: email._id, error: err.message })
        email.status = 'failed'
        await email.save()
      }
    }
  } catch (error) {
    logger.error('Error processing due emails:', error)
    throw error
  }
}

// Process Scheduled Campaigns (initial sends at scheduledAt)
async function processScheduledCampaigns() {
  try {
    const now = new Date()
    logger.info('Processing scheduled campaigns', { nowISO: now.toISOString() })
    const campaigns = await Campaign.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    })
      .populate('template')
      .populate('contacts')
      .populate('contactLists')

    logger.info('Scheduled campaigns due', { count: campaigns.length })

    for (const campaign of campaigns) {
      try {
        const contactListCounts = (campaign.contactLists || []).map((l) => (l.contacts || []).length)
        logger.info('Sending scheduled campaign', {
          campaignId: campaign._id?.toString(),
          userId: campaign.userId?.toString?.() || campaign.userId,
          name: campaign.name,
          scheduledAtISO: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString() : null,
          directContacts: (campaign.contacts || []).length,
          contactLists: (campaign.contactLists || []).length,
          contactListCounts,
        })
        // Trigger the same immediate send flow
        const result = await sendCampaignEmails(campaign._id, campaign.userId)
        logger.info('Scheduled campaign completed', {
          campaignId: campaign._id?.toString(),
          finalStatus: result?.status,
          sentAtISO: result?.sentAt ? new Date(result.sentAt).toISOString() : null,
        })
      } catch (err) {
        logger.error('Error sending scheduled campaign:', { campaignId: campaign._id, error: err.message })
      }
    }
  } catch (error) {
    logger.error('Error processing scheduled campaigns:', error)
    throw error
  }
}

// Render a simple, email-safe catalog block (table-based)
function renderCatalogHTML(items = [], layout = "grid2", showPrices = false) {
  if (!items.length) return ""
  const cols = layout === "grid3" ? 3 : layout === "list" ? 1 : 2
  const colWidth = Math.floor(100 / cols)
  const rows = []
  for (let i = 0; i < items.length; i += cols) {
    const slice = items.slice(i, i + cols)
    const tds = slice
      .map((it) => {
        const img = (it.images && it.images[0] && it.images[0].url) || ""
        const firstFile = (it.files && it.files[0]) || null
        const fileUrl = firstFile?.url || ""
        const fileName = firstFile?.originalFilename || "File"
        const fileType = firstFile?.mimeType || firstFile?.resourceType || ""
        const price = typeof it.price === "number" ? `₹${it.price.toFixed(2)}` : ""
        const title = it.title || "Item"
        const url = it.url || fileUrl || "#"
        const hasClickable = !!(url && url !== "#")
        const fileBlock = (!img && fileUrl)
          ? (`<div style="padding:12px;text-align:center;background:#f7f7f7;border-top:1px solid #eee;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333;margin-bottom:8px;">
                  📎 ${fileName}${fileType ? ` <span style='color:#777'>( ${fileType} )</span>` : ''}
                </div>
                <a href="${fileUrl}" target="_blank" style="display:inline-block;padding:8px 12px;background:#0b5ed7;color:#fff;text-decoration:none;border-radius:4px;">Open file</a>
              </div>`)
          : ""
        return (
          `<td width="${colWidth}%" valign="top" style="padding:8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden;">
              <tr>
                <td style="text-align:center;background:#fafafa;">
                  ${img ? (hasClickable ? `<a href="${url}" target="_blank"><img src="${img}" alt="${title}" style="display:block;width:100%;max-width:260px;height:auto;border:0;"/></a>` : `<img src="${img}" alt="${title}" style="display:block;width:100%;max-width:260px;height:auto;border:0;"/>`) : ""}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 12px;">
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;font-weight:600;line-height:1.3;">
                    ${hasClickable ? `<a href="${url}" target="_blank" style="color:#111;text-decoration:none;">${title}</a>` : `${title}`}
                  </div>
                  ${it.description ? `<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555;margin-top:6px;\">${it.description}</div>` : ""}
                  ${showPrices && price ? `<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111;margin-top:8px;font-weight:700;\">${price}</div>` : ""}
                </td>
              </tr>
              ${fileBlock ? `<tr><td>${fileBlock}</td></tr>` : ""}
            </table>
          </td>`
        )
      })
      .join("")
    rows.push(`<tr>${tds}</tr>`)
  }
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
    ${rows.join("")}
  </table>`
}

// Fallback: wrap plain text into a simple HTML block for HTML emails
function wrapTextAsHtml(text = "") {
  const safe = (text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const withBr = safe.replace(/\r?\n/g, "<br/>")
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;line-height:1.5;">${withBr}</div>
  `
}

// Build a plain-text version with catalog appended or placeholder-replaced
async function buildEmailTextWithCatalog(template) {
  const ids = template.selectedCatalogItemIds || []
  const placeholder = "{{CATALOG_BLOCK}}"
  if (!ids.length) return template.textContent || ""
  const items = await CatalogItem.find({ _id: { $in: ids } }).lean()
  const lines = []
  lines.push("")
  lines.push("Catalog:")
  items.forEach((it, idx) => {
    const price = typeof it.price === 'number' ? `₹${it.price.toFixed(2)}` : ''
    const firstFile = (it.files && it.files[0]) || null
    const fileUrl = firstFile?.url || ''
    const parts = [
      `${idx + 1}. ${it.title || 'Item'}`,
      price ? `Price: ${price}` : null,
      (it.url || fileUrl) ? `Link: ${it.url || fileUrl}` : null,
    ].filter(Boolean)
    lines.push(parts.join(" | "))
  })
  const block = lines.join("\n") + "\n"
  const base = template.textContent || ""
  if (base.includes(placeholder)) {
    return base.replace(placeholder, block)
  }
  return base + (base.endsWith("\n") ? "" : "\n") + block
}

async function buildEmailHtmlWithCatalog(template) {
  const ids = template.selectedCatalogItemIds || []
  const placeholder = "{{CATALOG_BLOCK}}"
  // Respect text-only preference when htmlContent is absent
  if (template.forceTextOnly && !template.htmlContent) {
    return "" // send as text-only
  }
  const baseHtml = (template.htmlContent && template.htmlContent.trim())
    ? template.htmlContent
    : wrapTextAsHtml(template.textContent || "")
  if (!ids.length) return baseHtml
  const items = await CatalogItem.find({ _id: { $in: ids } }).lean()
  const block = renderCatalogHTML(items, template.catalogLayout || "grid2", !!template.showPrices)
  if (baseHtml && baseHtml.includes(placeholder)) {
    return baseHtml.replace(placeholder, block)
  }
  // Append if placeholder not present
  return baseHtml + block
}

// Campaign Management
async function createCampaign(campaignData) {
  try {
    const campaign = new Campaign(campaignData)
    await campaign.save()
    logger.info(`Campaign created: ${campaign._id}`)

    // Auto-handle different send types based on user intent
    if (campaign.sendType === 'immediate') {
      logger.info(`Auto-starting immediate campaign: ${campaign._id}`)
      try {
        await startCampaign(campaign._id, campaign.userId)
        logger.info(`Immediate campaign auto-started: ${campaign._id}`)
      } catch (error) {
        logger.error(`Failed to auto-start immediate campaign: ${campaign._id}`, error)
        // Don't throw error, let campaign be created in draft status
      }
    } else if (campaign.sendType === 'scheduled') {
      logger.info(`Auto-scheduling campaign: ${campaign._id}`)
      try {
        await updateCampaignStatus(campaign._id, 'scheduled')
        logger.info(`Campaign auto-scheduled: ${campaign._id}`)
      } catch (error) {
        logger.error(`Failed to auto-schedule campaign: ${campaign._id}`, error)
      }
    } else if (campaign.sendType === 'sequence') {
      logger.info(`Auto-setting up sequence campaign: ${campaign._id}`)
      try {
        await setupSequenceFollowups(campaign._id, campaign.userId)
        logger.info(`Sequence campaign auto-setup: ${campaign._id}`)
      } catch (error) {
        logger.error(`Failed to auto-setup sequence campaign: ${campaign._id}`, error)
      }
    }

    return campaign
  } catch (error) {
    logger.error("Error creating campaign:", error)
    throw error
  }
}

// Admin: fetch all campaigns across users (no userId filter)
async function getAllCampaigns({ page = 1, limit = 10, search = "", status = "" }) {
  try {
    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ]
    }

    if (status) {
      query.status = status
    }

    const campaigns = await Campaign.find(query)
      .populate("template", "name subject")
      .populate("contacts", "email firstName lastName")
      .populate("contactLists", "name totalContacts")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Campaign.countDocuments(query)

    return {
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching all campaigns:", error)
    throw error
  }
}

async function getCampaigns(userId, { page = 1, limit = 10, search = "", status = "" }) {
  try {
    const query = { userId }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ]
    }
    
    if (status) {
      query.status = status
    }

    const campaigns = await Campaign.find(query)
      .populate("template", "name subject")
      .populate("contacts", "email firstName lastName")
      .populate("contactLists", "name totalContacts")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Campaign.countDocuments(query)

    return {
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching campaigns:", error)
    throw error
  }
}

async function getCampaignById(campaignId, userId) {
  try {
    const campaign = await Campaign.findOne({ _id: campaignId, userId })
      .populate("template", "name subject htmlContent")
      .populate("contacts", "email firstName lastName company")
      .populate("contactLists", "name totalContacts")
      .populate("userId", "name email")

    if (!campaign) {
      throw new Error("Campaign not found")
    }

    return campaign
  } catch (error) {
    logger.error("Error fetching campaign:", error)
    throw error
  }
}

async function updateCampaign(campaignId, userId, updateData) {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, userId },
      updateData,
      { new: true, runValidators: true }
    )

    if (!campaign) {
      throw new Error("Campaign not found")
    }

    logger.info(`Campaign updated: ${campaignId}`)
    return campaign
  } catch (error) {
    logger.error("Error updating campaign:", error)
    throw error
  }
}

async function deleteCampaign(campaignId, userId) {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: campaignId, userId })
    
    if (!campaign) {
      throw new Error("Campaign not found")
    }

    // Delete related followups
    await Followup.deleteMany({ campaignId })
    
    // Delete related emails
    await Email.deleteMany({ campaignId })
    
    // Delete related email tracking
    await EmailTracking.deleteMany({ campaignId })

    logger.info(`Campaign deleted: ${campaignId}`)
    return { message: "Campaign deleted successfully" }
  } catch (error) {
    logger.error("Error deleting campaign:", error)
    throw error
  }
}

// Contact Management
async function createContact(contactData) {
  try {
    const contact = new Contact(contactData)
    await contact.save()
    logger.info(`Contact created: ${contact._id}`)
    return contact
  } catch (error) {
    logger.error("Error creating contact:", error)
    throw error
  }
}

async function getContacts(userId, { page = 1, limit = 10, search = "", status = "", listId = "" }) {
  try {
    const query = { userId }
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ]
    }
    
    if (status) {
      query.status = status
    }

    if (listId) {
      query.listIds = listId
    }

    const contacts = await Contact.find(query)
      .populate("listIds", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Contact.countDocuments(query)

    return {
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching contacts:", error)
    throw error
  }
}

async function getAllContacts({ page = 1, limit = 10, search = "", status = "", listId = "" }) {
  try {
    const query = {}

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ]
    }

    if (status) {
      query.status = status
    }

    if (listId) {
      query.listIds = listId
    }

    const contacts = await Contact.find(query)
      .populate("listIds", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Contact.countDocuments(query)

    return {
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching all contacts:", error)
    throw error
  }
}

async function updateContact(contactId, userId, updateData) {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: contactId, userId },
      updateData,
      { new: true, runValidators: true }
    )

    if (!contact) {
      throw new Error("Contact not found")
    }

    logger.info(`Contact updated: ${contactId}`)
    return contact
  } catch (error) {
    logger.error("Error updating contact:", error)
    throw error
  }
}

async function deleteContact(contactId, userId) {
  try {
    const contact = await Contact.findOneAndDelete({ _id: contactId, userId })
    
    if (!contact) {
      throw new Error("Contact not found")
    }

    // Remove from contact lists
    await ContactList.updateMany(
      { contacts: contactId },
      { $pull: { contacts: contactId } }
    )

    logger.info(`Contact deleted: ${contactId}`)
    return { message: "Contact deleted successfully" }
  } catch (error) {
    logger.error("Error deleting contact:", error)
    throw error
  }
}

// Contact List Management
async function createContactList(listData) {
  try {
    const contactList = new ContactList(listData)
    await contactList.save()
    logger.info(`Contact list created: ${contactList._id}`)
    return contactList
  } catch (error) {
    logger.error("Error creating contact list:", error)
    throw error
  }
}

async function getContactLists(userId, { page = 1, limit = 10, search = "" }) {
  try {
    const query = { userId }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    }

    const contactLists = await ContactList.find(query)
      .populate("contacts", "email firstName lastName company")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await ContactList.countDocuments(query)

    return {
      contactLists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching contact lists:", error)
    throw error
  }
}

// Admin: fetch all contact lists across users (no userId filter)
async function getAllContactLists({ page = 1, limit = 10, search = "" }) {
  try {
    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    }

    const contactLists = await ContactList.find(query)
      .populate("contacts", "email firstName lastName company")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await ContactList.countDocuments(query)

    return {
      contactLists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching all contact lists:", error)
    throw error
  }
}

async function updateContactList(listId, userId, updateData) {
  try {
    const contactList = await ContactList.findOneAndUpdate(
      { _id: listId, userId },
      updateData,
      { new: true, runValidators: true }
    )

    if (!contactList) {
      throw new Error("Contact list not found")
    }

    logger.info(`Contact list updated: ${listId}`)
    return contactList
  } catch (error) {
    logger.error("Error updating contact list:", error)
    throw error
  }
}

async function deleteContactList(listId, userId) {
  try {
    const contactList = await ContactList.findOneAndDelete({ _id: listId, userId })
    
    if (!contactList) {
      throw new Error("Contact list not found")
    }

    // Remove list from contacts
    await Contact.updateMany(
      { listIds: listId },
      { $pull: { listIds: listId } }
    )

    logger.info(`Contact list deleted: ${listId}`)
    return { message: "Contact list deleted successfully" }
  } catch (error) {
    logger.error("Error deleting contact list:", error)
    throw error
  }
}

// Template Management
async function createTemplate(templateData) {
  try {
    const template = new Template(templateData)
    await template.save()
    logger.info(`Template created: ${template._id}`)
    return template
  } catch (error) {
    logger.error("Error creating template:", error)
    throw error
  }
}

async function getTemplates(userId, { page = 1, limit = 10, search = "", type = "", isActive = undefined, approvedOnly = false }) {
  try {
    const query = { userId }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ]
    }
    
    if (type) {
      query.type = type
    }
    if (typeof isActive === 'boolean') {
      query.isActive = isActive
    }
    if (approvedOnly) {
      query.approvedAt = { $ne: null }
    }

    const templates = await Template.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Template.countDocuments(query)

    return {
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching templates:", error)
    throw error
  }
}

async function updateTemplate(templateId, userId, updateData) {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: templateId, userId },
      updateData,
      { new: true, runValidators: true }
    )

    if (!template) {
      throw new Error("Template not found")
    }

    logger.info(`Template updated: ${templateId}`)
    return template
  } catch (error) {
    logger.error("Error updating template:", error)
    throw error
  }
}

async function deleteTemplate(templateId, userId) {
  try {
    const template = await Template.findOneAndDelete({ _id: templateId, userId })
    
    if (!template) {
      throw new Error("Template not found")
    }

    logger.info(`Template deleted: ${templateId}`)
    return { message: "Template deleted successfully" }
  } catch (error) {
    logger.error("Error deleting template:", error)
    throw error
  }
}

// Follow-up Management
async function createFollowup(followupData) {
  try {
    const followup = new Followup(followupData)
    await followup.save()
    logger.info(`Followup created: ${followup._id}`)
    return followup
  } catch (error) {
    logger.error("Error creating followup:", error)
    throw error
  }
}

async function getFollowups(userId, { page = 1, limit = 10, status = "", campaignId = "" }) {
  try {
    const query = { userId }
    
    if (status) {
      query.status = status
    }
    
    if (campaignId) {
      query.campaignId = campaignId
    }

    const followups = await Followup.find(query)
      .populate("campaignId", "name subject")
      .populate("contactId", "email firstName lastName")
      .populate("templateId", "name subject")
      .populate("originalEmailId", "subject sentAt")
      .sort({ scheduledAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Followup.countDocuments(query)

    return {
      followups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    logger.error("Error fetching followups:", error)
    throw error
  }
}

async function updateFollowup(followupId, userId, updateData) {
  try {
    const followup = await Followup.findOneAndUpdate(
      { _id: followupId, userId },
      updateData,
      { new: true, runValidators: true }
    )

    if (!followup) {
      throw new Error("Followup not found")
    }

    logger.info(`Followup updated: ${followupId}`)
    return followup
  } catch (error) {
    logger.error("Error updating followup:", error)
    throw error
  }
}

async function deleteFollowup(followupId, userId) {
  try {
    const followup = await Followup.findOneAndDelete({ _id: followupId, userId })
    
    if (!followup) {
      throw new Error("Followup not found")
    }

    logger.info(`Followup deleted: ${followupId}`)
    return { message: "Followup deleted successfully" }
  } catch (error) {
    logger.error("Error deleting followup:", error)
    throw error
  }
}

// Campaign Execution
async function startCampaign(campaignId, userId) {
  try {
    logger.info(`Starting campaign: ${campaignId} for user: ${userId}`)
    
    const campaign = await Campaign.findOne({ _id: campaignId, userId })
      .populate("template")
      .populate("contacts")
      .populate("contactLists")

    if (!campaign) {
      const error = new Error("Campaign not found")
      logger.error("Campaign not found:", { campaignId, userId })
      throw error
    }

    logger.info(`Campaign found: ${campaign.name}, status: ${campaign.status}`)

    if (campaign.status !== "draft") {
      const error = new Error("Campaign can only be started from draft status")
      logger.error("Invalid campaign status:", { campaignId, status: campaign.status })
      throw error
    }

    if (!campaign.template) {
      const error = new Error("Campaign template not found")
      logger.error("Campaign template missing:", { campaignId })
      throw error
    }

    // Get all contacts from campaign
    let contacts = [...campaign.contacts]
    logger.info(`Direct contacts: ${contacts.length}`)
    
    // Add contacts from contact lists
    for (const list of campaign.contactLists) {
      try {
        const listContacts = await Contact.find({ _id: { $in: list.contacts } })
        contacts = [...contacts, ...listContacts]
        logger.info(`Contacts from list ${list.name}: ${listContacts.length}`)
      } catch (error) {
        logger.error(`Error fetching contacts from list ${list._id}:`, error)
      }
    }

    // Remove duplicates
    const uniqueContacts = contacts.filter((contact, index, self) => 
      index === self.findIndex(c => c._id.toString() === contact._id.toString())
    )

    logger.info(`Total unique contacts: ${uniqueContacts.length}`)

    if (uniqueContacts.length === 0) {
      const error = new Error("No contacts found for campaign")
      logger.error("No contacts found:", { campaignId, totalContacts: contacts.length })
      throw error
    }

    // Update campaign status
    campaign.status = "sending"
    campaign.stats.totalSent = uniqueContacts.length
    await campaign.save()
    logger.info(`Campaign status updated to sending: ${campaignId}`)

    // Resolve per-user SMTP config once for this campaign/user
    const cfg = await resolveEmailConfigByUserId(userId)

    // Send initial emails
    const emailPromises = uniqueContacts.map(async (contact) => {
      try {
        logger.info(`Processing contact: ${contact.email}`)
        
        const computedHtml = await buildEmailHtmlWithCatalog(campaign.template)
        const computedText = await buildEmailTextWithCatalog(campaign.template)
        // Replace variables in final bodies using sender address from cfg
        const finalHtml = replaceVariables(computedHtml, contact, cfg.user || '')
        const finalText = replaceVariables(computedText, contact, cfg.user || '')
        const email = new Email({
          campaignId: campaign._id,
          contactId: contact._id,
          templateId: campaign.template._id,
          userId: userId,
          subject: campaign.subject || campaign.template.subject,
          htmlContent: finalHtml,
          textContent: finalText,
          status: "queued"
        })

        await email.save()
        logger.info(`Email record created: ${email._id}`)

        // Send email
        const emailResult = await emailService.sendEmail({
          to: contact.email,
          subject: email.subject,
          text: email.textContent,
          html: email.htmlContent || undefined,
        }, cfg)

        // Update email status
        email.status = "sent"
        email.sentAt = new Date()
        email.messageId = emailResult.messageId
        await email.save()

        // Create email tracking
        const tracking = new EmailTracking({
          emailId: email._id,
          campaignId: campaign._id,
          contactId: contact._id,
          trackingPixelId: `track_${email._id}_${Date.now()}`
        })
        await tracking.save()

        // Create followups if enabled
        if (campaign.settings.enableFollowups) {
          await createFollowupSequence(campaign, contact, email, userId)
        }

        logger.info(`Email sent successfully to: ${contact.email}`)
        return email
      } catch (error) {
        logger.error(`Error sending email to ${contact.email}:`, {
          error: error.message,
          stack: error.stack,
          contactId: contact._id,
          campaignId: campaign._id
        })
        return null
      }
    })

    await Promise.all(emailPromises)

    // Update campaign status
    campaign.status = "sent"
    campaign.sentAt = new Date()
    await campaign.save()

    logger.info(`Campaign started successfully: ${campaignId}`)
    return campaign
  } catch (error) {
    logger.error("Error starting campaign:", {
      error: error.message,
      stack: error.stack,
      campaignId,
      userId
    })
    throw error
  }
}

// Send campaign emails immediately
async function sendCampaignEmails(campaignId, userId) {
  try {
    const campaign = await Campaign.findOne({ _id: campaignId, userId })
      .populate("template")
      .populate("contacts")
      .populate("contactLists")

    if (!campaign) {
      throw new Error("Campaign not found")
    }

    // Get all contacts
    let contacts = [...campaign.contacts]
    for (const list of campaign.contactLists) {
      const listContacts = await Contact.find({ _id: { $in: list.contacts } })
      contacts = [...contacts, ...listContacts]
    }

    const uniqueContacts = contacts.filter((contact, index, self) => 
      index === self.findIndex(c => c._id.toString() === contact._id.toString())
    )

    logger.info('Immediate/scheduled send starting', {
      campaignId: campaign._id?.toString(),
      userId: campaign.userId?.toString?.() || campaign.userId,
      totalContacts: contacts.length,
      uniqueContacts: uniqueContacts.length,
    })

    // Send emails immediately
    const emailPromises = uniqueContacts.map(async (contact) => {
      try {
        const computedHtml2 = await buildEmailHtmlWithCatalog(campaign.template)
        const computedText2 = await buildEmailTextWithCatalog(campaign.template)
        const finalHtml2 = replaceVariables(computedHtml2, contact, emailService?.emailConfig?.user || '')
        const finalText2 = replaceVariables(computedText2, contact, emailService?.emailConfig?.user || '')
        const email = new Email({
          campaignId: campaign._id,
          contactId: contact._id,
          templateId: campaign.template._id,
          userId: userId,
          subject: campaign.subject || campaign.template.subject,
          htmlContent: finalHtml2,
          textContent: finalText2,
          status: "queued"
        })

        await email.save()
        logger.info('Email record created (immediate path)', { emailId: email._id?.toString(), contact: contact.email })

        // Send email immediately
        const emailResult = await emailService.sendEmail({
          to: contact.email,
          subject: email.subject,
          text: email.textContent,
          html: email.htmlContent
        })

        email.status = "sent"
        email.sentAt = new Date()
        email.messageId = emailResult.messageId
        await email.save()

        logger.info('SMTP send result (immediate path)', {
          emailId: email._id?.toString(),
          contact: contact.email,
          messageId: emailResult.messageId,
          accepted: emailResult.accepted,
          rejected: emailResult.rejected,
          response: emailResult.response,
        })

        return email
      } catch (error) {
        logger.error(`Error sending email to ${contact.email}:`, {
          error: error.message,
          stack: error.stack,
          campaignId: campaign._id?.toString(),
          contactId: contact._id?.toString(),
        })
        return null
      }
    })

    await Promise.all(emailPromises)

    // Update campaign status
    campaign.status = "sent"
    campaign.sentAt = new Date()
    await campaign.save()

    logger.info(`Campaign emails sent immediately`, {
      campaignId: campaignId?.toString?.() || campaignId,
      finalStatus: campaign.status,
      sentAtISO: campaign.sentAt?.toISOString?.() || null,
    })
    return campaign
  } catch (error) {
    logger.error("Error sending campaign emails:", {
      error: error.message,
      stack: error.stack,
      campaignId,
      userId,
    })
    throw error
  }
}

// Update campaign status
async function updateCampaignStatus(campaignId, status) {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { status },
      { new: true }
    )
    logger.info(`Campaign status updated: ${campaignId} -> ${status}`)
    return campaign
  } catch (error) {
    logger.error("Error updating campaign status:", error)
    throw error
  }
}

// Setup sequence follow-ups
async function setupSequenceFollowups(campaignId, userId) {
  try {
    const campaign = await Campaign.findOne({ _id: campaignId, userId })
      .populate("template")
      .populate("contacts")
      .populate("contactLists")

    if (!campaign) {
      throw new Error("Campaign not found")
    }

    if (!campaign.sequence) {
      throw new Error("Sequence configuration not found")
    }

    // Get all contacts
    let contacts = [...campaign.contacts]
    for (const list of campaign.contactLists) {
      const listContacts = await Contact.find({ _id: { $in: list.contacts } })
      contacts = [...contacts, ...listContacts]
    }

    const uniqueContacts = contacts.filter((contact, index, self) => 
      index === self.findIndex(c => c._id.toString() === contact._id.toString())
    )

    // Calculate follow-up schedule
    const { initialDelay, followupDelays, maxFollowups } = campaign.sequence

    // Log campaign and sequence config for diagnostics
    logger.info('Sequence setup starting', {
      campaignId: campaign._id?.toString(),
      userId: campaign.userId?.toString?.() || campaign.userId,
      totalContacts: contacts.length,
      uniqueContacts: uniqueContacts.length,
      sequence: {
        initialDelay,
        followupDelays,
        maxFollowups,
      },
      nowISO: new Date().toISOString(),
    })

    // Schedule initial emails (support fractional hours using milliseconds)
    const now = Date.now()
    const initialDelayMs = (Number(initialDelay) || 0) * 60 * 60 * 1000
    const initialScheduleTime = new Date(now + initialDelayMs)

    // Create follow-up schedule for each contact
    const followupPromises = uniqueContacts.map(async (contact) => {
      try {
        // Schedule initial email
        const initialEmail = new Email({
          campaignId: campaign._id,
          contactId: contact._id,
          templateId: campaign.template._id,
          userId: userId,
          subject: campaign.subject || campaign.template.subject,
          htmlContent: campaign.template.htmlContent,
          textContent: campaign.template.textContent,
          status: "queued",
          scheduledAt: initialScheduleTime
        })
        await initialEmail.save()
        logger.info('Initial email queued (sequence)', {
          emailId: initialEmail._id?.toString(),
          contact: contact.email,
          scheduledAtISO: initialEmail.scheduledAt?.toISOString?.() || null,
          scheduledAtIST: initialEmail.scheduledAt?.toLocaleString?.('en-IN', { timeZone: 'Asia/Kolkata' }) || null,
        })

        // Schedule follow-up emails
        let currentTimeMs = initialScheduleTime.getTime()
        const explicitSteps = Array.isArray(campaign.sequence?.steps) ? campaign.sequence.steps : []
        if (explicitSteps.length > 0) {
          // Use per-step template selection
          for (let i = 0; i < Math.min(maxFollowups, explicitSteps.length); i++) {
            const step = explicitSteps[i] || {}
            const delayHours = Number(step.delayHours) || 0
            const delayMs = delayHours * 60 * 60 * 1000
            currentTimeMs += delayMs
            const scheduledAt = new Date(currentTimeMs)

            // Load the selected template for this step
            const stepTemplate = step.templateId ? await Template.findById(step.templateId) : null
            if (!stepTemplate) {
              logger.warn('Step template not found, skipping follow-up step', {
                campaignId: campaign._id?.toString(),
                contact: contact.email,
                stepIndex: i,
                templateId: step.templateId || null,
              })
              continue
            }

            const followupEmail = new Email({
              campaignId: campaign._id,
              contactId: contact._id,
              templateId: stepTemplate._id,
              userId: userId,
              subject: stepTemplate.subject || `Follow-up ${i + 1}: ${campaign.subject || stepTemplate.subject}`,
              htmlContent: stepTemplate.htmlContent,
              textContent: stepTemplate.textContent,
              status: "queued",
              scheduledAt: scheduledAt,
              followupNumber: i + 1
            })
            await followupEmail.save()
            logger.info('Follow-up email queued (sequence - explicit step)', {
              emailId: followupEmail._id?.toString(),
              contact: contact.email,
              followupNumber: i + 1,
              scheduledAtISO: followupEmail.scheduledAt?.toISOString?.() || null,
              scheduledAtIST: followupEmail.scheduledAt?.toLocaleString?.('en-IN', { timeZone: 'Asia/Kolkata' }) || null,
              delayHours,
              templateId: stepTemplate._id?.toString(),
            })
          }
        } else {
          // Fall back to existing delays using the campaign's main template
          for (let i = 0; i < Math.min(maxFollowups, followupDelays.length); i++) {
            const delayHours = Number(followupDelays[i]) || 0
            const delayMs = delayHours * 60 * 60 * 1000
            currentTimeMs += delayMs
            const scheduledAt = new Date(currentTimeMs)

            const followupEmail = new Email({
              campaignId: campaign._id,
              contactId: contact._id,
              templateId: campaign.template._id,
              userId: userId,
              subject: `Follow-up ${i + 1}: ${campaign.subject || campaign.template.subject}`,
              htmlContent: campaign.template.htmlContent,
              textContent: campaign.template.textContent,
              status: "queued",
              scheduledAt: scheduledAt,
              followupNumber: i + 1
            })
            await followupEmail.save()
            logger.info('Follow-up email queued (sequence)', {
              emailId: followupEmail._id?.toString(),
              contact: contact.email,
              followupNumber: i + 1,
              scheduledAtISO: followupEmail.scheduledAt?.toISOString?.() || null,
              scheduledAtIST: followupEmail.scheduledAt?.toLocaleString?.('en-IN', { timeZone: 'Asia/Kolkata' }) || null,
              delayHours,
            })
          }
        }

        return contact
      } catch (error) {
        logger.error(`Error setting up sequence for ${contact.email}:`, {
          error: error.message,
          stack: error.stack,
          campaignId: campaign._id?.toString(),
          userId: userId,
        })
        return null
      }
    })

    await Promise.all(followupPromises)

    // Update campaign status
    campaign.status = "scheduled"
    await campaign.save()

    logger.info(`Sequence follow-ups setup complete`, {
      campaignId: campaignId?.toString?.() || campaignId,
      totalContacts: uniqueContacts.length,
      status: campaign.status,
      scheduledStartISO: initialScheduleTime?.toISOString?.() || null,
      scheduledStartIST: initialScheduleTime?.toLocaleString?.('en-IN', { timeZone: 'Asia/Kolkata' }) || null,
    })
    return campaign
  } catch (error) {
    logger.error("Error setting up sequence follow-ups:", {
      error: error.message,
      stack: error.stack,
      campaignId,
      userId,
    })
    throw error
  }
}

// Follow-up Sequence Creation
async function createFollowupSequence(campaign, contact, originalEmail, userId) {
  try {
    // If explicit steps exist, honor them; else fall back to auto-selection by type
    const explicitSteps = Array.isArray(campaign.sequence?.steps) ? campaign.sequence.steps : []

    if (explicitSteps.length > 0) {
      let baseTime = originalEmail?.sentAt ? new Date(originalEmail.sentAt).getTime() : Date.now()
      for (let i = 0; i < explicitSteps.length; i++) {
        const step = explicitSteps[i] || {}
        const delayHours = Number(step.delayHours) || 0
        const scheduledAt = new Date(baseTime + delayHours * 60 * 60 * 1000)

        // Load the selected template for this step
        const stepTemplate = step.templateId ? await Template.findById(step.templateId) : null
        if (!stepTemplate) {
          logger.warn('Step template not found for followup creation, skipping', {
            campaignId: campaign._id?.toString(),
            contact: contact.email,
            stepIndex: i,
            templateId: step.templateId || null,
          })
          continue
        }

        const followup = new Followup({
          campaignId: campaign._id,
          originalEmailId: originalEmail._id,
          contactId: contact._id,
          templateId: stepTemplate._id,
          userId: userId,
          sequence: i + 1,
          scheduledAt: scheduledAt,
          conditions: {
            requireOpen: step.conditions?.requireOpen ?? true,
            requireClick: step.conditions?.requireClick ?? false,
            requireNoReply: step.conditions?.requireNoReply ?? true,
          }
        })

        await followup.save()
      }
    } else {
      const followupTemplates = await Template.find({
        userId,
        type: { $in: ["followup1", "followup2", "followup3"] }
      }).sort({ type: 1 })

      const maxFollowups = Math.min(campaign.settings.maxFollowups, followupTemplates.length)
      const followupDelay = campaign.settings.followupDelay

      for (let i = 0; i < maxFollowups; i++) {
        const template = followupTemplates[i]
        if (!template) continue

        const scheduledAt = new Date()
        scheduledAt.setDate(scheduledAt.getDate() + (followupDelay * (i + 1)))

        const followup = new Followup({
          campaignId: campaign._id,
          originalEmailId: originalEmail._id,
          contactId: contact._id,
          templateId: template._id,
          userId: userId,
          sequence: i + 1,
          scheduledAt: scheduledAt,
          conditions: {
            requireOpen: true,
            requireClick: false,
            requireNoReply: true
          }
        })

        await followup.save()
      }
    }

    logger.info(`Followup sequence created for contact: ${contact.email}`)
  } catch (error) {
    logger.error("Error creating followup sequence:", error)
    throw error
  }
}

// Process Scheduled Followups
async function processScheduledFollowups() {
  try {
    const now = new Date()
    const scheduledFollowups = await Followup.find({
      status: "scheduled",
      scheduledAt: { $lte: now }
    }).populate("campaignId contactId templateId originalEmailId")

    for (const followup of scheduledFollowups) {
      try {
        // Check conditions
        const shouldSend = await checkFollowupConditions(followup)
        
        if (!shouldSend) {
          followup.status = "cancelled"
          await followup.save()
          continue
        }

        // Build HTML/TEXT with catalog and variables
        const computedHtml = await buildEmailHtmlWithCatalog(followup.templateId)
        const computedText = await buildEmailTextWithCatalog(followup.templateId)
        const finalHtml = replaceVariables(computedHtml, followup.contactId, emailService?.emailConfig?.user || '')
        const finalText = replaceVariables(computedText, followup.contactId, emailService?.emailConfig?.user || '')

        // Send followup email
        const email = new Email({
          campaignId: followup.campaignId._id,
          contactId: followup.contactId._id,
          templateId: followup.templateId._id,
          userId: followup.userId,
          subject: followup.templateId.subject,
          htmlContent: finalHtml,
          textContent: finalText,
          status: "queued",
          isFollowup: true,
          followupSequence: followup.sequence,
          parentEmailId: followup.originalEmailId._id
        })

        await email.save()

        // Send email
        const emailResult = await emailService.sendEmail({
          to: followup.contactId.email,
          subject: email.subject,
          text: email.textContent,
          html: email.htmlContent
        })

        // Update email status
        email.status = "sent"
        email.sentAt = new Date()
        email.messageId = emailResult.messageId
        await email.save()

        // Update followup status
        followup.status = "sent"
        followup.sentAt = new Date()
        await followup.save()

        // Create email tracking
        const tracking = new EmailTracking({
          emailId: email._id,
          campaignId: followup.campaignId._id,
          contactId: followup.contactId._id,
          trackingPixelId: `track_${email._id}_${Date.now()}`
        })
        await tracking.save()

        logger.info(`Followup sent: ${followup._id}`)
      } catch (error) {
        logger.error(`Error processing followup ${followup._id}:`, error)
        followup.status = "failed"
        await followup.save()
      }
    }
  } catch (error) {
    logger.error("Error processing scheduled followups:", error)
    throw error
  }
}

// Check Followup Conditions
async function checkFollowupConditions(followup) {
  try {
    const originalEmail = await Email.findById(followup.originalEmailId._id)
    if (!originalEmail) return false
    
    const tracking = await EmailTracking.findOne({ emailId: originalEmail._id })

    if (!tracking) return false

    // Check if email was opened
    if (followup.conditions.requireOpen) {
      const opened = tracking.events.some(event => event.type === "opened")
      if (!opened) return false
    }

    // Check if email was clicked
    if (followup.conditions.requireClick) {
      const clicked = tracking.events.some(event => event.type === "clicked")
      if (!clicked) return false
    }

    // Check if no reply received
    if (followup.conditions.requireNoReply) {
      const replied = tracking.events.some(event => event.type === "replied")
      if (replied) return false
    }

    return true
  } catch (error) {
    logger.error("Error checking followup conditions:", error)
    return false
  }
}

// Analytics and Reporting
async function getCampaignStats(campaignId, userId) {
  try {
    const campaign = await Campaign.findOne({ _id: campaignId, userId })
    if (!campaign) {
      throw new Error("Campaign not found")
    }

    const emails = await Email.find({ campaignId })
    const followups = await Followup.find({ campaignId })
    const tracking = await EmailTracking.find({ campaignId })

    // Calculate detailed stats
    const stats = {
      totalEmails: emails.length,
      totalFollowups: followups.length,
      sentEmails: emails.filter(e => e.status === "sent").length,
      sentFollowups: followups.filter(f => f.status === "sent").length,
      openedEmails: 0,
      clickedEmails: 0,
      repliedEmails: 0,
      bouncedEmails: 0,
      unsubscribed: 0
    }

    // Count tracking events
    for (const track of tracking) {
      for (const event of track.events) {
        switch (event.type) {
          case "opened":
            stats.openedEmails++
            break
          case "clicked":
            stats.clickedEmails++
            break
          case "replied":
            stats.repliedEmails++
            break
          case "bounced":
            stats.bouncedEmails++
            break
          case "unsubscribed":
            stats.unsubscribed++
            break
        }
      }
    }

    return stats
  } catch (error) {
    logger.error("Error getting campaign stats:", error)
    throw error
  }
}

// Manual start function for draft campaigns
async function manualStartCampaign(campaignId, userId) {
  try {
    const campaign = await Campaign.findOne({ _id: campaignId, userId })
    
    if (!campaign) {
      throw new Error("Campaign not found")
    }

    if (campaign.status !== "draft") {
      logger.info(`Manual start ignored: campaign ${campaignId} already in status ${campaign.status}`)
      return campaign
    }

    logger.info(`Manual start requested for campaign: ${campaignId}`)
    
    // Handle based on sendType
    if (campaign.sendType === 'immediate') {
      return await startCampaign(campaignId, userId)
    } else if (campaign.sendType === 'scheduled') {
      return await updateCampaignStatus(campaignId, 'scheduled')
    } else if (campaign.sendType === 'sequence') {
      return await setupSequenceFollowups(campaignId, userId)
    } else {
      throw new Error("Invalid send type")
    }
  } catch (error) {
    logger.error("Error in manual start:", error)
    throw error
  }
}

module.exports = {
  // Campaign Management
  createCampaign,
  getCampaigns,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  startCampaign,

  // Contact Management
  createContact,
  getContacts,
  getAllContacts,
  updateContact,
  deleteContact,

  // Contact List Management
  createContactList,
  getContactLists,
  getAllContactLists,
  updateContactList,
  deleteContactList,

  // Template Management
  createTemplate,
  getTemplates,
  getAllTemplates,
  updateTemplate,
  deleteTemplate,

  // Follow-up Management
  createFollowup,
  getFollowups,
  updateFollowup,
  deleteFollowup,

  // Campaign Execution
  processScheduledFollowups,
  processScheduledCampaigns,
  processDueEmails,
  sendCampaignEmails,
  updateCampaignStatus,
  setupSequenceFollowups,
  manualStartCampaign,

  // Analytics
  getCampaignStats
} 