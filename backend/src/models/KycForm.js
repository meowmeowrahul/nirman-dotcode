const mongoose = require("mongoose");

const { Schema } = mongoose;

const kycImageSchema = new Schema(
  {
    url: {
      type: String,
      trim: true,
      required: true,
    },
    mime_type: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const kycFormSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    aadhar_doc_photo: {
      type: kycImageSchema,
      required: true,
    },
    pan_doc_photo: {
      type: kycImageSchema,
      required: true,
    },
    verification_selfie: {
      type: kycImageSchema,
      required: true,
    },
    submitted_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("KycForm", kycFormSchema);
