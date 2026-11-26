import mongoose from 'mongoose';

const bomComponentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.0001, 'Component quantity must be greater than zero'],
  },
  scrapPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  notes: String,
});

const bomSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    bomNumber: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: String,
      default: '1.0',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    outputQuantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0.0001,
    },
    outputUnit: {
      type: String,
      required: true,
    },
    components: [bomComponentSchema],
    estimatedMaterialCost: {
      type: Number,
      default: 0,
    },
    laborCost: {
      type: Number,
      default: 0,
    },
    overheadCost: {
      type: Number,
      default: 0,
    },
    totalEstimatedCost: {
      type: Number,
      default: 0,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  { timestamps: true }
);

bomSchema.index({ companyId: 1, product: 1, version: 1 }, { unique: true });

export const BillOfMaterials = mongoose.model('BillOfMaterials', bomSchema);
