import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: String,
    department: {
      type: String,
      required: true,
      trim: true,
      // E.g. 'Production', 'Quality', 'Inventory', 'Procurement', 'Sales', 'Finance'
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    team: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.index({ companyId: 1, employeeCode: 1 });

export const Employee = mongoose.model('Employee', employeeSchema);
