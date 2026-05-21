import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  Calendar,
  FileText,
  Building2,
  Tag,
  Users,
  Bell,
  Menu,
  User,
  Settings,
  LogOut,
  Hexagon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';

export const SystemAdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { unreadCount, connectRealtime, disconnectRealtime } = useNotificationsStore();

  useEffect(() => {
    connectRealtime();
    return () => {
      disconnectRealtime();
    };
  }, [connectRealtime, disconnectRealtime]);

  const menuItems = [
    { path: '/admin', icon: BarChart3, label: 'Tổng quan', exact: true },
    { path: '/admin/events', icon: Calendar, label: 'Sự kiện' },
    { path: '/admin/pages', icon: FileText, label: 'Trang CLB' },
    { path: '/admin/categories', icon: Tag, label: 'Danh mục' },
    { path: '/admin/users', icon: Users, label: 'Người dùng' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop: Fixed, Mobile: Off-canvas */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-72 bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50
          transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="h-20 flex items-center px-6 border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30 text-white">
                <Hexagon className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                UTEHY Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 translate-x-1'
                        : 'text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-600 hover:translate-x-1'
                    }`
                  }
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110`} />
                  <span className="font-medium tracking-wide">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Admin Footer */}
          <div className="p-5 border-t border-slate-100/80 bg-gradient-to-b from-transparent to-white">
            <button
              onClick={() => logout()}
              className="group flex items-center gap-3 px-4 py-3 w-full text-left text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-100"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Wrapper: Topbar + Content */}
      <div className="flex-1 flex flex-col md:ml-72 min-w-0 transition-all duration-300">
        {/* Topbar (Glassmorphism) */}
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-white/50 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
          {/* Left: Hamburger Mobile + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Hệ thống Quản trị
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Chào mừng bạn quay trở lại!
              </p>
            </div>
          </div>

          {/* Right: Notifications + Admin Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group">
              <Bell className="h-5 w-5 group-hover:animate-wiggle" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 flex h-[18px] w-[18px] items-center justify-center bg-rose-500 text-xs font-medium text-white rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10 transition-all">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-inner">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden sm:block tracking-wide">
                  {user?.full_name || 'Administrator'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Framer motion wrapper cho hiệu ứng mượt mà khi đổi trang (optional but nice) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};