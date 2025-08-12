const mongoose = require("mongoose")

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    htmlContent: {
      type: String,
      required: true,
    },
    textContent: String,
    variables: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: ["initial", "followup1", "followup2", "followup3"],
      default: "initial",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    selectedCatalogItemIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "CatalogItem" }
    ],
    catalogLayout: {
      type: String,
      enum: ["grid2", "grid3", "list"],
      default: "grid2",
    },
    showPrices: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Template", templateSchema)
