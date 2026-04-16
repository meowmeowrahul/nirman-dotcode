const mongoose = require("mongoose");

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    beneficiary_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contributor_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    technician_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    city: {
      type: String,
      default: null,
      index: true,
    },
    region_id: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["PAID_IN_ESCROW", "PENDING_WARDEN_REVIEW", "VERIFIED", "IN_TRANSIT", "COMPLETED", "CANCELLED"],
      required: true,
      default: "PAID_IN_ESCROW",
      index: true,
    },
    escrow: {
      gas_value_deposited: {
        type: Number,
        required: true,
        default: 950.0,
      },
      metal_security_deposit: {
        type: Number,
        required: true,
        default: 2000.0,
      },
      service_fee: {
        type: Number,
        required: true,
        default: 150.0,
      },
      final_gas_payout: {
        type: Number,
        default: null,
      },
      refund_to_beneficiary: {
        type: Number,
        default: null,
      },
    },
    cylinder_evidence: {
      serial_number: {
        type: String,
        default: null,
      },
      physical_weight: {
        type: Number,
        default: null,
      },
      tare_weight: {
        type: Number,
        default: null,
      },
      actual_gas_kg: {
        type: Number,
        default: null,
      },
      safety_passed: {
        type: Boolean,
        default: null,
      },
    },
    contributor_acknowledgement: {
      status: {
        type: String,
        enum: ["PENDING", "ACKNOWLEDGED"],
        default: null,
      },
      message: {
        type: String,
        default: null,
      },
      sent_at: {
        type: Date,
        default: null,
      },
      acknowledged_at: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
