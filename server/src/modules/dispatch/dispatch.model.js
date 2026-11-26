import mongoose from 'mongoose';

const dispatchItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  orderedQuantity: {
    type: Number,
    required: true,
  },
  dispatchQuantity: {
    type: Number,
    required: true,
    min: 0.0001,
  },
  unitPrice: {
    type: Number,
    default: 0,
  },
  batchNumber: String,
});

const dispatchSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    dispatchNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    carrier: String,
    trackingNumber: String,
    items: [dispatchItemSchema],
    dispatchDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['dispatched', 'delivered', 'cancelled'],
      default: 'dispatched',
      index: true,
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

dispatchSchema.index({ companyId: 1, dispatchNumber: 1 });
dispatchSchema.index({ companyId: 1, salesOrderId: 1 });

export const Dispatch = mongoose.model('Dispatch', dispatchSchema);
