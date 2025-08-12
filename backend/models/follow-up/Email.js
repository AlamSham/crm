const mongoose = require("mongoose")

const emailSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    messageId: String,
    subject: String,
    htmlContent: String,
    textContent: String,
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "delivered", "bounced", "failed"],
      default: "queued",
    },
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    repliedAt: Date,
    bounceReason: String,
    trackingPixelId: String,
    isFollowup: {
      type: Boolean,
      default: false,
    },
    followupNumber: {
      type: Number,
      default: 0,
    },
    followupSequence: {
      type: Number,
      default: 0,
    },
    parentEmailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
    },
  },
  {
    timestamps: true,
  },
)

emailSchema.index({ campaignId: 1, contactId: 1 })
emailSchema.index({ trackingPixelId: 1 })

module.exports = mongoose.model("Email", emailSchema)
