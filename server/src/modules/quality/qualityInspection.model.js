import mongoose from 'mongoose';
import { QUALITY_STATUSES } from '../../config/constants.js';

const inspectionParameterSchema = new mongoose.Schema({
  parameterName: {
    type: String,
    required: true,
  },
  specification: String,
  targetValue: String,
  minValue: Number,
  maxValue: Number,
  actualValue: String,
  isPassed: {
    type: Boolean,
    default: true,
  },
  notes: String,
});

const defectRecordSchema = new mongoose.Schema({
  defectType: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['minor', 'major', 'critical'],
    default: 'minor',
  },
  count: {
    type: Number,
    default: 1,
  },
  description: String,
});

const qualityInspectionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    inspectionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inspectionType: {
      type: String,
      enum: ['incoming', 'in_process', 'final'],
      required: true,
      index: true,
    },
    referenceType: {
      type: String,
      enum: ['GOODS_RECEIPT', 'WORK_ORDER', 'INVENTORY'],
      required: true,
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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batchNumber: String,
    sampleSize: {
      type: Number,
      required: true,
      min: 1,
    },
    inspectedQuantity: {
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
    parameters: [inspectionParameterSchema],
    defects: [defectRecordSchema],
    status: {
      type: String,
      enum: Object.values(QUALITY_STATUSES),
      default: QUALITY_STATUSES.PENDING,
      index: true,
    },
    disposition: {
      type: String,
      enum: ['accept', 'reject', 'rework', 'scrap', 'pending'],
      default: 'pending',
    },
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inspectionDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { timestamps: true }
);

qualityInspectionSchema.index({ companyId: 1, inspectionNumber: 1 });
qualityInspectionSchema.index({ companyId: 1, inspectionType: 1 });

export const QualityInspection = mongoose.model('QualityInspection', qualityInspectionSchema);
