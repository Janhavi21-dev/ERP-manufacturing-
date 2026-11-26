import mongoose from 'mongoose';
import { STOCK_MOVEMENT_TYPES } from '../../config/constants.js';

const stockMovementSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    movementNumber: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(STOCK_MOVEMENT_TYPES),
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      // Positive for stock increases, Negative for stock decreases
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    batchNumber: {
      type: String,
      default: null,
      trim: true,
    },
    referenceType: {
      type: String,
      required: true,
      index: true,
      // E.g. 'PURCHASE_RECEIPT', 'WORK_ORDER', 'DISPATCH', 'STOCK_ADJUSTMENT', 'STOCK_TRANSFER'
    },
    referenceId: {
      type: String,
      default: null,
      index: true,
    },
    referenceNumber: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: 'System',
    },
    notes: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for common queries
stockMovementSchema.index({ companyId: 1, productId: 1, timestamp: -1 });
stockMovementSchema.index({ companyId: 1, warehouseId: 1, timestamp: -1 });
stockMovementSchema.index({ companyId: 1, referenceType: 1, referenceId: 1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
