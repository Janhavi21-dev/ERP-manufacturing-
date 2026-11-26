import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // E.g. 'Utilities', 'Maintenance', 'Rent', 'Raw Materials Shipping', 'Salaries', 'Office Supplies'
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card'],
      default: 'Bank Transfer',
    },
    vendor: {
      type: String,
      trim: true,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
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

expenseSchema.index({ companyId: 1, expenseNumber: 1 });
expenseSchema.index({ companyId: 1, expenseDate: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
