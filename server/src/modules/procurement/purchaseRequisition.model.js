import mongoose from 'mongoose';

const purchaseRequisitionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    requisitionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        requiredDate: Date,
        estimatedCost: {
          type: Number,
          default: 0,
        },
        notes: String,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'converted_to_po'],
      default: 'draft',
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: Date,
    approvalNotes: String,
  },
  { timestamps: true }
);

purchaseRequisitionSchema.index({ companyId: 1, requisitionNumber: 1 });

export const PurchaseRequisition = mongoose.model('PurchaseRequisition', purchaseRequisitionSchema);
