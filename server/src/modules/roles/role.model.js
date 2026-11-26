import mongoose from 'mongoose';
import { ROLES, ROLE_PERMISSIONS } from '../../config/constants.js';

const roleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null, // null for default system roles shared across or specific to company
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

roleSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model('Role', roleSchema);
