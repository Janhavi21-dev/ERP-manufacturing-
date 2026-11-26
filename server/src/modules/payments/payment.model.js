import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentType: {
      type: String,
      enum: ['CUSTOMER_RECEIPT', 'SUPPLIER_PAYMENT'],
      required: true,
      index: true,
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'partyModel',
      index: true,
    },
    partyModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Supplier'],
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card'],
      default: 'Bank Transfer',
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

paymentSchema.index({ companyId: 1, paymentNumber: 1 });
paymentSchema.index({ companyId: 1, paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
