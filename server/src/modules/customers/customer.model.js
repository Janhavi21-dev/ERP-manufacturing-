import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
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
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    taxNumber: String,
    creditLimit: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: String,
      default: 'Due on Receipt',
    },
    balance: {
      type: Number,
      default: 0, // Outstanding receivables
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

customerSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
