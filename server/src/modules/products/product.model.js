import mongoose from 'mongoose';
import { ITEM_TYPES } from '../../config/constants.js';

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: true,
    },
    itemType: {
      type: String,
      enum: Object.values(ITEM_TYPES),
      required: true,
      index: true,
    },
    uom: {
      type: String,
      required: [true, 'Unit of measure is required'],
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    standardCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      default: 50,
      min: 0,
    },
    preferredSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    taxRate: {
      type: Number,
      default: 0, // percentage
      min: 0,
    },
    trackBatchExpiry: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure unique SKU per company
productSchema.index({ companyId: 1, sku: 1 }, { unique: true });

export const Product = mongoose.model('Product', productSchema);
