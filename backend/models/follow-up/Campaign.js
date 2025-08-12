const mongoose = require("mongoose")

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: false,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
      },
    ],
    contactLists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContactList",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "paused", "completed"],
      default: "draft",
    },
    sendType: {
      type: String,
      enum: ["immediate", "scheduled", "sequence"],
      default: "immediate",
    },
    scheduledAt: Date,
    sentAt: Date,
    sequence: {
      initialDelay: { type: Number, default: 0 }, // hours
      followupDelays: [{ type: Number }], // hours between followups
      maxFollowups: { type: Number, default: 3 },
      conditions: {
        openEmail: { type: Boolean, default: false },
        clickLink: { type: Boolean, default: false },
        replyEmail: { type: Boolean, default: false },
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    settings: {
      trackOpens: { type: Boolean, default: true },
      trackClicks: { type: Boolean, default: true },
      enableFollowups: { type: Boolean, default: true },
      followupDelay: { type: Number, default: 3 }, // days
      maxFollowups: { type: Number, default: 3 },
    },
    stats: {
      totalSent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      replied: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Campaign", campaignSchema)
