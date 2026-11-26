import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means broadcast to company
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    category: {
      type: String,
      enum: ['INVENTORY', 'PROCUREMENT', 'PRODUCTION', 'QUALITY', 'SALES', 'FINANCE', 'SYSTEM'],
      default: 'SYSTEM',
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ companyId: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

export const createNotification = async ({
  companyId,
  userId = null,
  title,
  message,
  type = 'info',
  category = 'SYSTEM',
  link = null,
}) => {
  try {
    return await Notification.create({
      companyId,
      userId,
      title,
      message,
      type,
      category,
      link,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};
