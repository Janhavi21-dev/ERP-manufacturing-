import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Company code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    taxNumber: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    settings: {
      allowNegativeStock: {
        type: Boolean,
        default: false,
      },
      quarantineRejectedStock: {
        type: Boolean,
        default: true,
      },
      requireInspectionForRawMaterials: {
        type: Boolean,
        default: true,
      },
      requireInspectionForFinishedGoods: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Company = mongoose.model('Company', companySchema);
