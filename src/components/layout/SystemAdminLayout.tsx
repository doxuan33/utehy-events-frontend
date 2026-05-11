import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Calendar, FileText, Building2, Tag, Users, Bell, Menu, User, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

export const SystemAdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/admin', icon: BarChart3, label: 'Tổng quan', exact: true },
    { path: '/admin/events', icon: Calendar, label: 'Sự kiện' },
    { path: '/admin/pages', icon: FileText, label: 'Trang CLB' },
    { path: '/admin/categories', icon: Tag, label: 'Danh mục' },
    { path: '/admin/users', icon: Users, label: 'Người dùng' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop: Fixed, Mobile: Off-canvas */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <span className="text-xl font-bold text-gray-900">UTEHY Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Admin Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Wrapper: Topbar + Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-20">
          {/* Left: Hamburger Mobile + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 hidden md:block">
              Hệ thống Quản trị
            </h1>
          </div>

          {/* Right: Notifications + Admin Profile */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative ml-2">
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user?.full_name || 'Admin'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};