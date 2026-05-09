import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { Avatar } from '@/components/common/Avatar';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Calendar,
  QrCode,
  Presentation,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Settings,
  User,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNotificationsStore } from '@/store/notifications.store';

export const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, connectRealtime, disconnectRealtime } = useNotificationsStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      connectRealtime();
    }
    return () => {
      disconnectRealtime();
    };
  }, [user]);

  const navItems = [
    { path: '/', icon: Home, label: 'Bảng tin & AI Gợi ý', exact: true },
    { path: '/checkin', icon: QrCode, label: 'Điểm danh GPS' },
    { path: '/scan-qr', icon: Presentation, label: 'Trình chiếu QR' },
    { path: '/events', icon: Calendar, label: 'Quản lý Sự kiện' },
  ];

  const handleLogout = () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      authApi.logout(refreshToken).catch(console.error);
    }
    logout();
    navigate('/login');
  };

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.path}
        end={item.exact}
        onClick={() => setIsMobileMenuOpen(false)}
        className={({ isActive }) =>
          `group flex items-center gap-3 px-4 py-3 mx-3 rounded-xl transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-yellow-400 via-emerald-400 to-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-600 hover:bg-white/60 hover:backdrop-blur-md hover:border hover:border-white/30'
          }`
        }
      >
        <div className="relative">
          <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
          {item.path === '/notifications' && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className={`font-medium ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
          {item.label}
        </span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/50 flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        transition={{ type: 'spring', damping: 20 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 glassmorphism-lg overflow-hidden"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-400 via-emerald-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
                UTEHY Social
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 px-3 py-2">
            <Link to="/profile">
              <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
            </Link>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.training_points || 0} điểm RL</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden glassmorphism border-b border-white/20 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-400 via-emerald-400 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <span className="font-bold text-gray-900">UTEHY Social</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-white/60 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4 space-y-2 overflow-hidden"
              >
                {navItems.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};