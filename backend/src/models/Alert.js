const mongoose = require("mongoose");

const { Schema } = mongoose;

const alertSchema = new Schema(
  {
    transaction_id: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      index: true,
    },
    alert_type: {
      type: String,
      required: true,
      default: "FRAUD_GUARD",
      index: true,
    },
    combined_risk_score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    flags: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ["GEMINI_FLASH", "GEMINI_FALLBACK", "GEMINI_TIMEOUT_FALLBACK", "SARVAM_FALLBACK"],
      default: "GEMINI_FLASH",
    },
    review_status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "RESOLVED"],
      default: "OPEN",
      index: true,
    },
    review_reason: {
      type: String,
      default: null,
    },
    context: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

alertSchema.index({ transaction_id: 1, alert_type: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Alert", alertSchema);