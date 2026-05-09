import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, MessageCircle, LogOut, User as UserIcon, Menu, X, Home, Calendar, Users, QrCode, BookOpen } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Trang chủ' },
  { path: '/events', icon: Calendar, label: 'Sự kiện' },
  { path: '/clubs', icon: Users, label: 'Câu lạc bộ' },
  { path: '/checkin', icon: QrCode, label: 'Điểm danh GPS' },
  { path: '/my-events', icon: BookOpen, label: 'Lịch trình' },
];

export const TopNavbar = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50"
    >
       <div className="w-full px-4 md:px-8 lg:px-12 flex items-center justify-between h-full">
        {/* Left - Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="UTEHY Social" className="h-8 w-auto" />
          </Link>
          <span className="text-xl font-bold text-gray-900 hidden sm:inline">
            UTEHY Social
          </span>
        </div>

        {/* Center - 50% - Search + Desktop Navigation */}
        <div className="flex-1 max-w-sm mx-4 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50"
            />
          </form>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex w-auto items-center justify-center gap-1 h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-16 h-full transition-colors ${
                    isActive
                      ? 'text-emerald-500'
                      : 'text-gray-600 hover:bg-gray-100 rounded-lg'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-6 w-6" />
                    {isActive && <div className="w-6 border-b-[3px] border-emerald-500 mt-1 rounded-full" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right - 25% */}
        <div className="w-1/4 flex items-center justify-end gap-2">
          {user ? (
            <>
              {/* Desktop Icons */}
              <div className="hidden md:flex items-center gap-2">
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    `relative p-2 rounded-full transition-colors ${
                      isActive ? 'text-emerald-500 bg-emerald-50' : 'text-gray-600 hover:text-emerald-500 hover:bg-gray-100'
                    }`
                  }
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>

                <button className="p-2 text-gray-600 hover:text-emerald-500 hover:bg-gray-100 rounded-full transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <UserIcon className="h-4 w-4" />
                          Trang cá nhân
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mobile Icons */}
              <div className="flex md:hidden items-center gap-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                  <Search className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center p-1 rounded-full hover:bg-gray-100"
                >
                  <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-500 hover:bg-gray-100 rounded-lg transition-colors">
                  Đăng nhập
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                  Đăng ký
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-14 left-0 w-full bg-white border-t border-gray-200 shadow-md p-4 flex flex-col gap-2 md:hidden"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 mt-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};