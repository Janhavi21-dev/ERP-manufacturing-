import mongoose from 'mongoose';
import { WORK_ORDER_STATUSES } from '../../config/constants.js';

const plannedMaterialSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  requiredQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  issuedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  returnedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitCost: {
    type: Number,
    default: 0,
  },
});

const workOrderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    workOrderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    bom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillOfMaterials',
      required: true,
    },
    bomVersion: {
      type: String,
      required: true,
    },
    plannedQuantity: {
      type: Number,
      required: true,
      min: [0.0001, 'Planned quantity must be greater than zero'],
    },
    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    plannedMaterials: [plannedMaterialSchema],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    startDate: Date,
    targetDate: Date,
    actualStartDate: Date,
    actualCompletionDate: Date,
    status: {
      type: String,
      enum: Object.values(WORK_ORDER_STATUSES),
      default: WORK_ORDER_STATUSES.DRAFT,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actualOutput: {
      acceptedQuantity: {
        type: Number,
        default: 0,
      },
      rejectedQuantity: {
        type: Number,
        default: 0,
      },
      scrapQuantity: {
        type: Number,
        default: 0,
      },
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

workOrderSchema.index({ companyId: 1, workOrderNumber: 1 });
workOrderSchema.index({ companyId: 1, status: 1 });

export const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
