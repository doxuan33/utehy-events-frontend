import { Outlet, NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Users, Settings, FileText, BarChart3, Tag, Building2 } from 'lucide-react';
import { TopNavbar } from './TopNavbar';

export const SystemAdminLayout = () => {
  const menuItems = [
    { path: '/admin', icon: BarChart3, label: 'Tổng quan', exact: true },
    { path: '/admin/system', icon: BarChart3, label: 'Hệ thống' },
    { path: '/admin/events', icon: Calendar, label: 'Sự kiện' },
    { path: '/admin/pages', icon: FileText, label: 'Trang CLB' },
    { path: '/admin/clubs', icon: Building2, label: 'Quản lý CLB' },
    { path: '/admin/categories', icon: Tag, label: 'Danh mục' },
    { path: '/admin/users', icon: Users, label: 'Người dùng' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600/5 to-white">
      <TopNavbar />

      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar (20%) */}
          <aside className="lg:col-span-2">
            <nav className="space-y-1 sticky top-24">
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
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
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
          </aside>

          {/* Main Content (80%) */}
          <main className="lg:col-span-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};