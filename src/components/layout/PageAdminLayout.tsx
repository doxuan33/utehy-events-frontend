import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  QrCode
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/common/Avatar';

export const PageAdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { path: '/page-admin', icon: LayoutDashboard, label: 'Tổng quan', exact: true },
    { path: '/page-admin/events', icon: Calendar, label: 'Quản lý Sự kiện' },
    { path: '/page-admin/posts', icon: FileText, label: 'Quản lý Bài viết' },
    { path: '/page-admin/members', icon: Users, label: 'Thành viên' },
    { path: '/page-admin/settings', icon: Settings, label: 'Cài đặt' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ===== FIXED SIDEBAR (LEFT) - Contains ONLY Logo + Navigation ===== */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30">
        {/* Logo Section - Sidebar Header */}
        <div className="p-6 border-b border-gray-100">
          <Link to="/page-admin" className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">UTEHY Admin</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Quản lý CLB</p>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 border-l-4'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer - CLB Status */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">CLB đang quản lý</p>
            <p className="text-sm font-bold text-gray-900 truncate">CLB Sinh viên UTEHY</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              Đang hoạt động
            </p>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA (RIGHT) - with left margin for sidebar ===== */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* ===== TOPBAR - No logo, only search + actions ===== */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200">
          <div className="h-full px-4 md:px-8 flex items-center justify-between">
            {/* Left - Mobile Menu + Search */}
            <div className="flex items-center gap-3 flex-1">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Desktop Search - Hidden on mobile */}
              <div className="hidden md:block relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sự kiện, bài viết, thành viên..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right - Notifications + Profile */}
            <div className="flex items-center gap-2 ml-4">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile Dropdown - FIXED Z-INDEX */}
              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user?.full_name?.split(' ')[0]}</span>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 z-[100] bg-white rounded-2xl shadow-xl border border-gray-100 py-2"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900">{user?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* ===== PAGE CONTENT ===== */}
        <main className="flex-1 p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 lg:hidden flex flex-col"
            >
              {/* Mobile Menu Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <Link to="/page-admin" className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-gray-900">UTEHY Admin</h1>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Quản lý CLB</p>
                  </div>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Nav Items */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.exact}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 border-l-4'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-100'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-gray-100">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">CLB đang quản lý</p>
                  <p className="text-sm font-bold text-gray-900 truncate">CLB Sinh viên UTEHY</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
