import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotificationsStore } from '@/store/notifications.store';
import { Link } from 'react-router-dom';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications
  } = useNotificationsStore();

  // Load danh sách thông báo khi click mở lần đầu
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen, notifications.length, fetchNotifications]);

  // Xử lý click outside để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) markAsRead(id);
    setIsOpen(false);
    // (Tuỳ chọn) Thêm logic chuyển hướng dựa vào type của notification ở đây
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group"
      >
        <Bell className="h-5 w-5 group-hover:animate-wiggle" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 flex h-[18px] w-[18px] items-center justify-center bg-rose-500 text-xs font-medium text-white rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-[100] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-gray-800 text-base">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
            
            {/* Body List */}
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                  <Bell className="h-8 w-8 text-gray-300" />
                  <p>Bạn chưa có thông báo nào.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif: any) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.is_read)}
                      className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-slate-50 flex gap-3 ${!notif.is_read ? 'bg-emerald-50/30' : ''}`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {!notif.is_read ? (
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1.5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5 font-medium">
                          {new Date(notif.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-gray-100 text-center bg-slate-50/50">
              <Link 
                to="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};