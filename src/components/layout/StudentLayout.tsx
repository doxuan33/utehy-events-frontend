import { Outlet, NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { TopNavbar } from './TopNavbar';
import { AiChatbotAssistant } from '@/components/ui/AiChatbotAssistant';
import { CheckinWidget } from '@/components/student/CheckinWidget';
import { Home, Calendar, Users, QrCode, Award, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const leftNavItems = [
  { path: '/', icon: Home, label: 'Bảng tin' },
  { path: '/events', icon: Calendar, label: 'Sự kiện' },
  { path: '/clubs', icon: Users, label: 'Câu lạc bộ' },
  { path: '/checkin', icon: QrCode, label: 'Điểm danh GPS' },
  { path: '/my-events', icon: BookOpen, label: 'Sự kiện của tôi' },
];

export const StudentLayout = () => {
  const { user } = useAuthStore();

  return (
    // 1. Nền tổng thể màu xám cực nhạt để nổi bật các Card trắng
    <div className="min-h-screen bg-slate-50 font-sans">
      <TopNavbar />

      {/* 2. Container chính: Xóa bỏ max-w-7xl, sử dụng max-w-[1920px] và padding responsive */}
      <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 pt-20 pb-10 flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center">
        
        {/* CỘT TRÁI (Sidebar) - Cố định width (khoảng 20%) */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col w-full min-w-[240px] max-w-[280px] sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pr-2"
        >
          {/* Menu Điều Hướng */}
          <nav className="flex flex-col gap-1 mb-6 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            {leftNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Card Thành tích cá nhân */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-bold text-gray-800">Thành tích cá nhân</span>
            </div>
            <div className="flex justify-between items-end border-t border-gray-50 pt-3">
              <span className="text-sm text-gray-500 font-medium">Điểm rèn luyện</span>
              <span className="text-2xl font-bold text-emerald-500">{user?.training_points || 0}</span>
            </div>
          </div>
        </motion.aside>

        {/* CỘT GIỮA (Main Feed) - Chiếm phần lớn không gian */}
        {/* Đã xóa overflow-y-auto và box viền trắng để thả rông nội dung */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full max-w-[900px] min-h-[calc(100vh-6rem)] mx-auto flex flex-col"
        >
          <Outlet />
        </motion.section>

        {/* CỘT PHẢI (Widgets) - Cố định width (khoảng 25%) */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden xl:flex flex-col w-full min-w-[280px] max-w-[320px] sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pl-2 gap-6"
        >
          <CheckinWidget />
          <AiChatbotAssistant />
        </motion.aside>
        
      </main>
    </div>
  );
};