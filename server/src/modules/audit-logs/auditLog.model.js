import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
    },
    recordId: {
      type: String,
      default: null,
      index: true,
    },
    recordRef: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export const recordAuditLog = async ({
  companyId = null,
  user = null,
  action,
  module,
  recordId = null,
  recordRef = null,
  details = null,
  status = 'SUCCESS',
  req = null,
  session = null,
}) => {
  try {
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    const entry = new AuditLog({
      companyId: companyId || user?.companyId || null,
      userId: user?._id || user?.id || null,
      userName: user?.name || 'System',
      action,
      module,
      recordId: recordId ? String(recordId) : null,
      recordRef,
      details,
      status,
      ipAddress: ip,
      userAgent,
    });

    await entry.save({ session });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};
