import mongoose from 'mongoose';
import { SALES_ORDER_STATUSES } from '../../config/constants.js';

const soItemSchema = new mongoose.Schema({
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
  dispatchedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
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

const salesOrderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    soNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    items: [soItemSchema],
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
    deliveryDate: Date,
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    paymentTerms: {
      type: String,
      default: 'Due on Receipt',
    },
    status: {
      type: String,
      enum: Object.values(SALES_ORDER_STATUSES),
      default: SALES_ORDER_STATUSES.DRAFT,
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

salesOrderSchema.index({ companyId: 1, soNumber: 1 });
salesOrderSchema.index({ companyId: 1, customer: 1, status: 1 });

export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
