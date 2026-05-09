import { useEffect } from 'react';
import { useNotificationsStore } from '@/store/notifications.store';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Award,
  Users,
  Target,
  Info,
  Clock,
  CheckSquare,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const NotificationsPage = () => {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount
  } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'EVENT_APPROVED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'EVENT_NEW':
        return <Calendar className="h-5 w-5 text-emerald-600" />;
      case 'EVENT_REMINDER':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'CHECKIN_SUCCESS':
        return <Target className="h-5 w-5 text-emerald-600" />;
      case 'POINTS_AWARDED':
      case 'TRAINING_POINTS':
        return <Award className="h-5 w-5 text-yellow-600" />;
      case 'NEW_FOLLOWER':
      case 'CLUB_UPDATE':
        return <Users className="h-5 w-5 text-indigo-600" />;
      case 'SYSTEM':
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'EVENT_APPROVED':
      case 'EVENT_NEW':
        return 'bg-emerald-100';
      case 'EVENT_REMINDER':
        return 'bg-amber-100';
      case 'CHECKIN_SUCCESS':
        return 'bg-emerald-100';
      case 'POINTS_AWARDED':
      case 'TRAINING_POINTS':
        return 'bg-yellow-100';
      case 'NEW_FOLLOWER':
      case 'CLUB_UPDATE':
        return 'bg-indigo-100';
      case 'SYSTEM':
      default:
        return 'bg-gray-100';
    }
  };

  const getLink = (notification: any) => {
    const data = notification.data;
    if (data?.event_id) return `/events/${data.event_id}`;
    if (data?.page_id) return `/clubs/${data.page_id}`;
    return '#';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Thông báo</h1>
          <p className="text-sm text-gray-500 font-medium">
            {unreadCount > 0
              ? `Bạn có ${unreadCount} thông báo chưa đọc`
              : 'Bạn đã xem tất cả thông báo'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold"
            onClick={() => markAllAsRead()}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full mb-4"
          />
          <p className="text-gray-500 font-medium">Đang tải thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm"
        >
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Hộp thư trống</h3>
          <p className="text-gray-500 font-medium">Bạn chưa có thông báo nào mới</p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
        >
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => {
              const link = getLink(notification);
              const isUnread = !notification.is_read;

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative rounded-3xl border transition-all hover:shadow-md ${
                    isUnread
                      ? 'bg-emerald-50/40 border-emerald-100 shadow-sm'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <Link
                    to={link}
                    onClick={() => isUnread && markAsRead(notification.id)}
                    className="flex items-start p-5 space-x-4"
                  >
                    {/* Icon */}
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${isUnread ? getIconBg(notification.type) : 'bg-gray-100'}`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`text-sm font-bold truncate pr-4 ${
                          isUnread ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: vi
                          })}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed line-clamp-2 ${
                        isUnread ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.body}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0 self-center" />
                  </Link>

                  {/* Unread Indicator */}
                  {isUnread && (
                    <div className="absolute top-5 right-5 h-2.5 w-2.5 bg-emerald-500 rounded-full shadow-sm" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
