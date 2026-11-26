import mongoose from 'mongoose';

const grnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  orderedQuantity: {
    type: Number,
    required: true,
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  acceptedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  rejectedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  batchNumber: {
    type: String,
    trim: true,
  },
  rejectionReason: String,
});

const goodsReceiptSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    grnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    deliveryNoteNumber: {
      type: String,
      trim: true,
    },
    items: [grnItemSchema],
    inspectionStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'partial'],
      default: 'passed',
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

goodsReceiptSchema.index({ companyId: 1, grnNumber: 1 });
goodsReceiptSchema.index({ companyId: 1, purchaseOrderId: 1 });

export const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);
