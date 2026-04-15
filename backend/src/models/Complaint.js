const mongoose = require("mongoose");

const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    reporter_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accused_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    region_id: {
      type: String,
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ["OVERPRICING", "MISCONDUCT", "SAFETY", "FRAUD", "OTHER"],
      required: true,
      default: "OTHER",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"],
      required: true,
      default: "OPEN",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);
