import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    taxNumber: String,
    paymentTerms: {
      type: String,
      default: 'Net 30',
    },
    balance: {
      type: Number,
      default: 0, // Total payable
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

supplierSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Supplier = mongoose.model('Supplier', supplierSchema);
