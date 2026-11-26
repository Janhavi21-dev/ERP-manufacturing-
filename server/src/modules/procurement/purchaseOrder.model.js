import mongoose from 'mongoose';
import { PO_STATUSES } from '../../config/constants.js';

const poItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.0001, 'Quantity must be greater than zero'],
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    poNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    items: [poItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    expectedDeliveryDate: Date,
    paymentTerms: {
      type: String,
      default: 'Net 30',
    },
    status: {
      type: String,
      enum: Object.values(PO_STATUSES),
      default: PO_STATUSES.DRAFT,
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ companyId: 1, poNumber: 1 });
purchaseOrderSchema.index({ companyId: 1, supplier: 1, status: 1 });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
