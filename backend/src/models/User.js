const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["BENEFICIARY", "CONTRIBUTOR", "TECHNICIAN", "WARDEN"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    kyc: {
      status: {
        type: String,
        enum: ["PENDING", "VERIFIED", "REJECTED"],
        default: "PENDING",
        required: true,
      },
      omc_id: {
        type: String,
        required: function requiredOmcId() {
          return ["BENEFICIARY", "CONTRIBUTOR"].includes(this.role);
        },
      },
      masked_aadhar: {
        type: String,
      },
    },
    region_id: {
      type: String,
      required: function requiredRegion() {
        return ["TECHNICIAN", "WARDEN"].includes(this.role);
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        validate: {
          validator(value) {
            return Array.isArray(value) && value.length === 2;
          },
          message: "location.coordinates must be [lng, lat]",
        },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ location: "2dsphere" });

userSchema.pre("validate", function validateContact(next) {
  if (!this.email && !this.phone) {
    this.invalidate("email", "Either email or phone is required");
  }

  if (!this.name) {
    if (this.email) {
      this.name = this.email;
    } else if (this.phone) {
      this.name = this.phone;
    }
  }

  next();
});

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
