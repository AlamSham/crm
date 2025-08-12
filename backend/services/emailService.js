const Imap = require("imap")
const nodemailer = require("nodemailer")
const { simpleParser } = require("mailparser")
const emailConfig = require("../config/emailConfig")

// Mock email data for development
const mockEmails = [
  {
    threadId: "thread1",
    emails: [
      {
        uid: "email1",
        headers: {
          from: ["John Doe <john@example.com>"],
          to: ["me@example.com"],
          subject: ["Welcome to our service"],
          date: ["2024-01-15T10:30:00Z"],
          "message-id": ["<msg1@example.com>"]
        },
        body: {
          text: "Welcome to our service! We're excited to have you on board.",
          html: "<p>Welcome to our service! We're excited to have you on board.</p>"
        },
        attachments: []
      }
    ]
  },
  {
    threadId: "thread2", 
    emails: [
      {
        uid: "email2",
        headers: {
          from: ["Jane Smith <jane@company.com>"],
          to: ["me@example.com"],
          subject: ["Meeting tomorrow"],
          date: ["2024-01-14T15:45:00Z"],
          "message-id": ["<msg2@example.com>"]
        },
        body: {
          text: "Hi, let's meet tomorrow at 2 PM to discuss the project.",
          html: "<p>Hi, let's meet tomorrow at 2 PM to discuss the project.</p>"
        },
        attachments: []
      }
    ]
  }
]

// Email parsing utility functions
function htmlToText(html) {
  if (!html) return ""

  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

  // Replace common HTML entities
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
  }

  Object.keys(entities).forEach((entity) => {
    text = text.replace(new RegExp(entity, "g"), entities[entity])
  })

  // Replace HTML tags with appropriate text
  text = text.replace(/<br\s*\/?>/gi, "\n")
  text = text.replace(/<\/p>/gi, "\n\n")
  text = text.replace(/<\/div>/gi, "\n")
  text = text.replace(/<\/h[1-6]>/gi, "\n\n")
  text = text.replace(/<li[^>]*>/gi, "• ")
  text = text.replace(/<\/li>/gi, "\n")

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "")

  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, "\n\n")
  text = text.replace(/[ \t]+/g, " ")
  text = text.trim()

  return text
}

function parseEmailBody(rawBody) {
  return new Promise((resolve) => {
    // Use mailparser to properly parse the email
    simpleParser(rawBody, (err, parsed) => {
      if (err) {
        console.error("Error parsing email:", err)
        resolve({
          textContent: rawBody,
          htmlContent: null,
          attachments: [],
        })
        return
      }

      const result = {
        textContent: "",
        htmlContent: null,
        attachments: [],
      }

      // Get text content
      if (parsed.text) {
        result.textContent = parsed.text
      } else if (parsed.html) {
        result.textContent = htmlToText(parsed.html)
      }

      // Get HTML content
      if (parsed.html) {
        result.htmlContent = parsed.html
      }

      // Process attachments
      if (parsed.attachments && parsed.attachments.length > 0) {
        result.attachments = parsed.attachments.map((att) => ({
          filename: att.filename || "unnamed",
          contentType: att.contentType || "application/octet-stream",
          size: att.size || 0,
          contentId: att.cid || null,
          base64Data: att.content ? att.content.toString("base64") : "",
        }))
      }

      resolve(result)
    })
  })
}

async function fetchSpamMails({ page = 1, limit = 10, search = "" }) {
  return new Promise((resolve, reject) => {
    // Check if email config is available
    if (!emailConfig.user || !emailConfig.password) {
      console.log("Email config not available, using mock data for spam mails")
      let mockData = [...mockEmails]

      // Filter by search if needed
      if (search) {
        const s = search.toLowerCase()
        mockData = mockData.filter((thread) =>
          thread.emails.some((e) => {
            const subj = (e.headers.subject[0] || "").toLowerCase()
            const from = (e.headers.from[0] || "").toLowerCase()
            const content = ((e.body && e.body.text) || "").toLowerCase()
            return subj.includes(s) || from.includes(s) || content.includes(s)
          }),
        )
      }

      // Apply pagination
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedData = mockData.slice(start, end)

      resolve(paginatedData)
      return
    }

    const imapConnection = new Imap({
      user: emailConfig.user,
      password: emailConfig.password,
      host: emailConfig.imapHost,
      port: emailConfig.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    imapConnection.once("ready", async () => {
      try {
        // Gmail Spam mailbox name
        const spamEmails = await fetchEmailsFromFolder(imapConnection, "[Gmail]/Spam", 1, "*")

        let filtered = spamEmails
        if (search) {
          const s = search.toLowerCase()
          filtered = spamEmails.filter((e) => {
            const subj = (e.headers.subject[0] || "").toLowerCase()
            const from = (e.headers.from[0] || "").toLowerCase()
            const content = (e.textContent || "").toLowerCase()
            return subj.includes(s) || from.includes(s) || content.includes(s)
          })
        }

        const grouped = groupEmailsByThread(filtered)
        const start = (page - 1) * limit
        const end = start + limit
        const paginated = grouped.slice(start, end)

        // Format response
        const formattedThreads = paginated.map((thread) => ({
          threadId: thread[0].threadId,
          emails: thread.map((email) => ({
            headers: email.headers,
            body: email.textContent,
            htmlContent: email.htmlContent,
            attachments: email.attachments,
            seqno: email.seqno,
            uid: email.uid,
            threadId: email.threadId,
            _debugThreadId: email._debugThreadId,
          })),
        }))

        resolve(formattedThreads)
      } catch (err) {
        reject(err)
      } finally {
        imapConnection.end()
      }
    })

    imapConnection.once("error", (err) => reject(err))
    imapConnection.connect()
  })
}

function fetchEmailsFromFolder(imapConnection, folder, start, end) {
  return new Promise((resolve, reject) => {
    const emails = []

    imapConnection.openBox(folder, false, (err, box) => {
      if (err) return reject(err)
      if (box.messages.total === 0) return resolve([])

      const fetch = imapConnection.seq.fetch(`${start}:${end}`, {
        bodies: "",
        struct: true,
      })

      fetch.on("message", (msg, seqno) => {
        const email = {
          headers: {},
          rawBody: "",
          seqno: seqno,
          uid: null,
          threadId: null,
        }

        msg.on("body", (stream, info) => {
          let buffer = ""
          stream.on("data", (chunk) => {
            buffer += chunk.toString("utf8")
          })

          stream.once("end", () => {
            email.rawBody = buffer
          })
        })

        msg.once("attributes", (attrs) => {
          email.uid = attrs.uid
          if (attrs["x-gm-thrid"]) {
            email.threadId = String(attrs["x-gm-thrid"])
          } else {
            email.threadId = null
          }
        })

        msg.once("end", () => {
          emails.push(email)
        })
      })

      fetch.once("error", (err) => reject(err))

      fetch.once("end", async () => {
        // Parse all emails
        const parsedEmails = []

        for (const email of emails) {
          try {
            const parsedBody = await parseEmailBody(email.rawBody)

            // Parse headers using simpleParser
            const parsed = await new Promise((resolve) => {
              simpleParser(email.rawBody, (err, result) => {
                if (err) {
                  resolve({
                    from: ["Unknown"],
                    to: ["Unknown"],
                    subject: ["No Subject"],
                    date: [new Date().toISOString()],
                    "message-id": [email.uid.toString()],
                    references: [],
                  })
                } else {
                  resolve({
                    from: [result.from ? result.from.text : "Unknown"],
                    to: result.to ? result.to.text.split(",") : ["Unknown"],
                    subject: [result.subject || "No Subject"],
                    date: [result.date ? result.date.toISOString() : new Date().toISOString()],
                    "message-id": [result.messageId || email.uid.toString()],
                    references: result.references ? [result.references] : [],
                    cc: result.cc ? result.cc.text.split(",") : undefined,
                  })
                }
              })
            })

            parsedEmails.push({
              headers: parsed,
              textContent: parsedBody.textContent,
              htmlContent: parsedBody.htmlContent,
              attachments: parsedBody.attachments,
              seqno: email.seqno,
              uid: email.uid,
              threadId: email.threadId || email.uid.toString(),
              _debugThreadId: email.threadId || email.uid.toString(),
            })
          } catch (error) {
            console.error("Error parsing email:", error)
            // Add fallback email
            parsedEmails.push({
              headers: {
                from: ["Unknown"],
                to: ["Unknown"],
                subject: ["Parse Error"],
                date: [new Date().toISOString()],
                "message-id": [email.uid.toString()],
              },
              textContent: "Error parsing email content",
              htmlContent: null,
              attachments: [],
              seqno: email.seqno,
              uid: email.uid,
              threadId: email.threadId || email.uid.toString(),
              _debugThreadId: email.threadId || email.uid.toString(),
            })
          }
        }

        // Sort by date
        parsedEmails.sort((a, b) => {
          const dateA = new Date(a.headers.date[0])
          const dateB = new Date(b.headers.date[0])
          return dateB - dateA
        })

        resolve(parsedEmails)
      })
    })
  })
}

function groupEmailsByThread(emails) {
  const threadMap = new Map()

  for (const email of emails) {
    let threadId = email.threadId
    if (!threadId && email.headers["message-id"] && email.headers["message-id"][0]) {
      threadId = email.headers["message-id"][0]
    }
    if (!threadId) {
      threadId = String(email.uid)
    }

    if (!threadMap.has(threadId)) threadMap.set(threadId, [])
    email._debugThreadId = threadId
    threadMap.get(threadId).push(email)
  }

  return Array.from(threadMap.values())
}

async function fetchAllMails({ page = 1, limit = 10, search = "" }) {
  return new Promise((resolve, reject) => {
    // Check if email config is available
    if (!emailConfig.user || !emailConfig.password) {
      console.log("Email config not available, using mock data")
      let mockData = [...mockEmails]
      
      // Filter by search if needed
      if (search) {
        const s = search.toLowerCase()
        mockData = mockData.filter((thread) =>
          thread.emails.some((e) => {
            const subj = (e.headers.subject[0] || "").toLowerCase()
            const from = (e.headers.from[0] || "").toLowerCase()
            const content = (e.body.text || "").toLowerCase()
            return subj.includes(s) || from.includes(s) || content.includes(s)
          }),
        )
      }
      
      // Apply pagination
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedData = mockData.slice(start, end)
      
      resolve(paginatedData)
      return
    }

    const imapConnection = new Imap({
      user: emailConfig.user,
      password: emailConfig.password,
      host: emailConfig.imapHost,
      port: emailConfig.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    let allEmails = []

    imapConnection.once("ready", async () => {
      try {
        // Fetch from both INBOX and [Gmail]/Sent Mail
        const inboxEmails = await fetchEmailsFromFolder(imapConnection, "INBOX", 1, "*")
        const sentEmails = await fetchEmailsFromFolder(imapConnection, "[Gmail]/Sent Mail", 1, "*")

        allEmails = [...inboxEmails, ...sentEmails]

        // Remove duplicate threads (by threadId)
        const threadMap = new Map()
        for (const email of allEmails) {
          let threadId = email.threadId
          if (!threadId && email.headers["message-id"] && email.headers["message-id"][0]) {
            threadId = email.headers["message-id"][0]
          }
          if (!threadId) {
            threadId = String(email.uid)
          }

          if (!threadMap.has(threadId)) threadMap.set(threadId, [])
          threadMap.get(threadId).push(email)
        }

        let grouped = Array.from(threadMap.values())

        // Filter by search if needed
        if (search) {
          const s = search.toLowerCase()
          grouped = grouped.filter((thread) =>
            thread.some((e) => {
              const subj = (e.headers.subject[0] || "").toLowerCase()
              const from = (e.headers.from[0] || "").toLowerCase()
              const content = (e.textContent || "").toLowerCase()
              return subj.includes(s) || from.includes(s) || content.includes(s)
            }),
          )
        }

        // Sort threads by latest email date
        grouped.sort((a, b) => {
          const dateA = new Date(a[0].headers.date[0])
          const dateB = new Date(b[0].headers.date[0])
          return dateB - dateA
        })

        // Pagination
        const start = (page - 1) * limit
        const end = start + limit
        const paginated = grouped.slice(start, end)

        // Format response
        const formattedThreads = paginated.map((thread) => ({
          threadId: thread[0].threadId,
          emails: thread.map((email) => ({
            headers: email.headers,
            body: email.textContent, // Send clean text content
            htmlContent: email.htmlContent, // Send HTML separately
            attachments: email.attachments, // Send parsed attachments
            seqno: email.seqno,
            uid: email.uid,
            threadId: email.threadId,
            _debugThreadId: email._debugThreadId,
          })),
        }))

        resolve(formattedThreads)
      } catch (err) {
        reject(err)
      } finally {
        imapConnection.end()
      }
    })

    imapConnection.once("error", (err) => reject(err))
    imapConnection.connect()
  })
}

async function fetchSentMails({ page = 1, limit = 10, search = "" }) {
  return new Promise((resolve, reject) => {
    // Check if email config is available
    if (!emailConfig.user || !emailConfig.password) {
      console.log("Email config not available, using mock data for sent mails")
      let mockData = [...mockEmails]
      
      // Filter by search if needed
      if (search) {
        const s = search.toLowerCase()
        mockData = mockData.filter((thread) =>
          thread.emails.some((e) => {
            const subj = (e.headers.subject[0] || "").toLowerCase()
            const from = (e.headers.from[0] || "").toLowerCase()
            const content = (e.body.text || "").toLowerCase()
            return subj.includes(s) || from.includes(s) || content.includes(s)
          }),
        )
      }
      
      // Apply pagination
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedData = mockData.slice(start, end)
      
      resolve(paginatedData)
      return
    }

    const imapConnection = new Imap({
      user: emailConfig.user,
      password: emailConfig.password,
      host: emailConfig.imapHost,
      port: emailConfig.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    let allEmails = []

    imapConnection.once("ready", async () => {
      try {
        const sentEmails = await fetchEmailsFromFolder(imapConnection, "[Gmail]/Sent Mail", 1, "*")
        const inboxEmails = await fetchEmailsFromFolder(imapConnection, "INBOX", 1, "*")

        const sentThreadIds = new Set(sentEmails.map((e) => e.threadId).filter(Boolean))
        allEmails = [...sentEmails, ...inboxEmails.filter((e) => e.threadId && sentThreadIds.has(e.threadId))]

        let filtered = allEmails
        if (search) {
          const s = search.toLowerCase()
          filtered = allEmails.filter((e) => {
            const subj = (e.headers.subject[0] || "").toLowerCase()
            const from = (e.headers.from[0] || "").toLowerCase()
            const content = (e.textContent || "").toLowerCase()
            return subj.includes(s) || from.includes(s) || content.includes(s)
          })
        }

        const grouped = groupEmailsByThread(filtered)
        const start = (page - 1) * limit
        const end = start + limit
        const paginated = grouped.slice(start, end)

        // Format response
        const formattedThreads = paginated.map((thread) => ({
          threadId: thread[0].threadId,
          emails: thread.map((email) => ({
            headers: email.headers,
            body: email.textContent,
            htmlContent: email.htmlContent,
            attachments: email.attachments,
            seqno: email.seqno,
            uid: email.uid,
            threadId: email.threadId,
            _debugThreadId: email._debugThreadId,
          })),
        }))

        resolve(formattedThreads)
      } catch (err) {
        reject(err)
      } finally {
        imapConnection.end()
      }
    })

    imapConnection.once("error", (err) => reject(err))
    imapConnection.connect()
  })
}

async function fetchReceivedMails({ page = 1, limit = 10, search = "" }) {
  return new Promise((resolve, reject) => {
    // Check if email config is available
    if (!emailConfig.user || !emailConfig.password) {
      console.log("Email config not available, using mock data for received mails")
      let mockData = [...mockEmails]
      
      // Filter by search if needed
      if (search) {
        const s = search.toLowerCase()
        mockData = mockData.filter((thread) =>
          thread.emails.some((e) => {
            const subj = (e.headers.subject[0] || "").toLowerCase()
            const from = (e.headers.from[0] || "").toLowerCase()
            const content = (e.body.text || "").toLowerCase()
            return subj.includes(s) || from.includes(s) || content.includes(s)
          }),
        )
      }
      
      // Apply pagination
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedData = mockData.slice(start, end)
      
      resolve(paginatedData)
      return
    }

    const imapConnection = new Imap({
      user: emailConfig.user,
      password: emailConfig.password,
      host: emailConfig.imapHost,
      port: emailConfig.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    let allEmails = []

    imapConnection.once("ready", async () => {
      try {
        const inboxEmails = await fetchEmailsFromFolder(imapConnection, "INBOX", 1, "*")
        const sentEmails = await fetchEmailsFromFolder(imapConnection, "[Gmail]/Sent Mail", 1, "*")

        const receivedThreadIds = new Set(inboxEmails.map((e) => e.threadId).filter(Boolean))
        allEmails = [...inboxEmails, ...sentEmails.filter((e) => e.threadId && receivedThreadIds.has(e.threadId))]

        let filtered = allEmails
        if (search) {
          const s = search.toLowerCase()
          filtered = allEmails.filter((e) => {
            const subj = (e.headers.subject[0] || "").toLowerCase()
            const from = (e.headers.from[0] || "").toLowerCase()
            const content = (e.textContent || "").toLowerCase()
            return subj.includes(s) || from.includes(s) || content.includes(s)
          })
        }

        const grouped = groupEmailsByThread(filtered)
        const start = (page - 1) * limit
        const end = start + limit
        const paginated = grouped.slice(start, end)

        // Format response
        const formattedThreads = paginated.map((thread) => ({
          threadId: thread[0].threadId,
          emails: thread.map((email) => ({
            headers: email.headers,
            body: email.textContent,
            htmlContent: email.htmlContent,
            attachments: email.attachments,
            seqno: email.seqno,
            uid: email.uid,
            threadId: email.threadId,
            _debugThreadId: email._debugThreadId,
          })),
        }))

        resolve(formattedThreads)
      } catch (err) {
        reject(err)
      } finally {
        imapConnection.end()
      }
    })

    imapConnection.once("error", (err) => reject(err))
    imapConnection.connect()
  })
}

// Use a pooled transport to improve throughput and reuse connections
const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.password,
  },
})

async function sendEmail({ to, cc, bcc, subject, text, html, attachments }) {
  try {
    if (!emailConfig.user || !emailConfig.password) {
      throw new Error('Email configuration is missing. Please check emailConfig.user and emailConfig.password');
    }

    if (!to) {
      throw new Error('Recipient email address is required');
    }

    const mailOptions = {
      from: emailConfig.user,
      to,
      cc: cc || "",
      bcc: bcc || "",
      subject: subject || "No Subject",
      text: text || "No message body",
      html: html || undefined,
      attachments: attachments || [],
    }

    console.log('Sending email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      from: mailOptions.from
    });

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId);
    return info
  } catch (error) {
    console.error('Error sending email:', {
      error: error.message,
      to,
      subject,
      emailConfig: {
        user: emailConfig.user ? 'Set' : 'Not set',
        password: emailConfig.password ? 'Set' : 'Not set'
      }
    });
    throw error;
  }
}

async function replyToEmail({ to, cc, bcc, subject, text, html, messageId, references, attachments }) {
  const mailOptions = {
    from: emailConfig.user,
    to,
    cc: cc || "",
    bcc: bcc || "",
    subject: subject.startsWith("Re:") ? subject : "Re: " + subject,
    text,
    html: html || undefined,
    inReplyTo: `<${messageId}>`,
    references: references ? `${references} <${messageId}>` : `<${messageId}>`,
    attachments: attachments || [],
  }

  const info = await transporter.sendMail(mailOptions)
  return info
}

module.exports = {
  fetchAllMails,
  fetchSentMails,
  fetchReceivedMails,
  fetchSpamMails,
  sendEmail,
  replyToEmail,
}

// Add Spam fetcher (placed after exports for diff clarity; actual export added below)

