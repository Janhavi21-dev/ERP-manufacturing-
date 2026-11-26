import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
  },
  { timestamps: true }
);

counterSchema.index({ companyId: 1, key: 1, year: 1 }, { unique: true });

export const Counter = mongoose.model('Counter', counterSchema);
