import React from 'react';
import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from '../../redux/api/notificationApiSlice';
import LoadingPage from '../../components/ui/LoadingPage';
import EmptyState from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/utils';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { data: response, isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllReadMutation();

  const notifications = response?.data?.items || response?.data || [];

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark notifications');
    }
  };

  if (isLoading) return <LoadingPage message="Loading notifications..." />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">System Notifications</h1>
          <p className="text-xs text-gray-500">Alerts, order status changes, and critical stock warnings</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={isMarkingAll}
            className="btn-secondary btn-sm"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No unread notifications"
          description="You are completely caught up with all shop floor and procurement alerts."
        />
      ) : (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`p-4 flex items-start justify-between gap-4 transition cursor-pointer ${
                n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-primary-50/30 hover:bg-primary-50/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    n.isRead ? 'bg-gray-300' : 'bg-primary-600'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">{n.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
