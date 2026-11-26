import mongoose from 'mongoose';

const stockBalanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
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
    onHand: {
      type: Number,
      default: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    quarantined: {
      type: Number,
      default: 0,
      min: 0,
    },
    allocated: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMovementAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index per company, product, and warehouse
stockBalanceSchema.index(
  { companyId: 1, productId: 1, warehouseId: 1 },
  { unique: true }
);

// Virtual field for available stock
stockBalanceSchema.virtual('available').get(function () {
  return Math.max(0, (this.onHand || 0) - (this.reserved || 0) - (this.quarantined || 0));
});

export const StockBalance = mongoose.model('StockBalance', stockBalanceSchema);
