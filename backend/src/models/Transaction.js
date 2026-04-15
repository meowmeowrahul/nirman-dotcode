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
    region_id: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["PAID_IN_ESCROW", "VERIFIED", "IN_TRANSIT", "COMPLETED", "CANCELLED"],
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
