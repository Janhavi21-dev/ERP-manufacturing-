import mongoose from 'mongoose';

const nonconformanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    ncrNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QualityInspection',
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batchNumber: String,
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      default: 'major',
    },
    defectDescription: {
      type: String,
      required: true,
      trim: true,
    },
    rootCause: {
      type: String,
      trim: true,
    },
    correctiveAction: {
      type: String,
      trim: true,
    },
    preventiveAction: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'under_investigation', 'action_pending', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    disposition: {
      type: String,
      enum: ['rework', 'scrap', 'return_to_vendor', 'use_as_is', 'pending'],
      default: 'pending',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionDate: Date,
  },
  { timestamps: true }
);

nonconformanceSchema.index({ companyId: 1, ncrNumber: 1 });

export const Nonconformance = mongoose.model('Nonconformance', nonconformanceSchema);
