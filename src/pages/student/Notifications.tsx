import { useEffect, useState } from 'react';
import { notificationsApi } from '@/api/notifications.api';
import { Avatar } from '@/components/common/Avatar';
import { motion } from 'motion/react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationsApi.getAll();
        const data = res.data.data;
        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        <button className="text-sm font-medium text-blue-600 hover:underline">
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Bell className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Bạn chưa có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-2xl border transition-all flex items-start space-x-4 ${
                n.is_read 
                  ? 'bg-white border-gray-100' 
                  : 'bg-blue-50 border-blue-100 shadow-sm'
              }`}
            >
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {n.content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: vi })}
                </p>
              </div>
              {!n.is_read && (
                <button 
                  onClick={() => handleMarkAsRead(n.id)}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Đánh dấu đã đọc"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
