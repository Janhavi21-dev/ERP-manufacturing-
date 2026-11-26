import { Notification } from './notification.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const query = {
    companyId: req.companyId,
    $or: [{ userId: req.user._id }, { userId: null }],
  };

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ ...query, isRead: false }),
  ]);

  return ApiResponse.success(res, {
    notifications,
    unreadCount,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      companyId: req.companyId,
    },
    { isRead: true },
    { new: true }
  );

  return ApiResponse.success(res, notification, 'Marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      companyId: req.companyId,
      $or: [{ userId: req.user._id }, { userId: null }],
      isRead: false,
    },
    { isRead: true }
  );

  return ApiResponse.success(res, null, 'All notifications marked as read');
});
