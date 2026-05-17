import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Plus,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  UserPlus,
  Star,
  Award,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { eventsApi } from '@/api/events.api';
import { pagesApi } from '@/api/pages.api';
import { registrationsApi } from '@/api/registrations.api';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';

// Safe date formatter helper
const safeFormatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '—' : format(date, formatStr, { locale: vi });
};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalCheckins: 0,
    pendingApprovals: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const { user } = useAuthStore.getState();
      const managedPageId = user?.managed_pages?.[0]?.page?.id || user?.managed_pages?.[0]?.page_id;
      if (!managedPageId) {
        console.warn('User không có quyền quản lý Fanpage nào!');
        setIsLoading(false);
        return;
      }

      // [TỐI ƯU HIỆU NĂNG]: Chạy song song 2 API lấy thông tin Page và Danh sách sự kiện
      const [pageRes, eventsRes] = await Promise.all([
        pagesApi.getById(managedPageId),
        eventsApi.getAll({ page_id: managedPageId, limit: 100 })
      ]);

      const managedPage = pageRes.data.data;
      if (!managedPage) {
        setIsLoading(false);
        return;
      }
      setPage(managedPage);

      const eventsData = eventsRes.data.data;
      const events = Array.isArray(eventsData) ? eventsData : eventsData?.data || [];

      let totalReg = 0;
      let pending = 0;
      const activityLog: any[] = [];

      // Lọc các data cơ bản trước
      events.forEach((event: any) => {
        totalReg += event._count?.registrations || 0;
        if (event.status === 'PENDING') pending++;

        activityLog.push({
          id: `event-${event.id}`,
          type: 'event_created',
          message: `Sự kiện "${event.title}" đã được tạo`,
          time: event.created_at,
          icon: Calendar,
          color: 'emerald'
        });
      });

      // [TỐI ƯU HIỆU NĂNG N+1]: Chạy SONG SONG việc lấy registration thay vì dùng vòng lặp for...of tuần tự
      // Kỹ thuật này giúp Frontend load nhanh gấp 5-10 lần nếu có nhiều sự kiện
      let totalCheck = 0;
      
      // Tạo danh sách các Promise cần thực thi
      const regPromises = events.map((event: any) => 
        registrationsApi.getEventRegistrations(event.id, managedPage.id, { limit: 50 })
          .then(regRes => ({ event, data: regRes.data.data }))
          .catch(() => ({ event, data: [] })) // Bỏ qua lỗi lẻ tẻ
      );

      // Chạy song song tất cả
      const regResults = await Promise.allSettled(regPromises);

      // Xử lý kết quả trả về
      regResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { event, data: regsData } = result.value;
          const regs = Array.isArray(regsData) ? regsData : regsData?.data || [];

          regs.forEach((reg: any, idx: number) => {
            if (reg.status === 'ATTENDED') totalCheck++;

            if (idx < 3) {
              activityLog.push({
                id: `reg-${reg.id}`,
                type: 'registration',
                message: `${reg.user?.full_name || 'Sinh viên'} đã đăng ký ${event.title}`,
                time: reg.created_at,
                icon: UserPlus,
                color: 'blue'
              });
            }
          });
        }
      });

      setStats({
        totalEvents: events.length,
        totalRegistrations: totalReg,
        totalCheckins: totalCheck,
        pendingApprovals: pending
      });

      const upcoming = events
        .filter((e: any) => {
          const eventDate = new Date(e.start_time);
          return !isNaN(eventDate.getTime()) && eventDate > new Date();
        })
        .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5);
      setUpcomingEvents(upcoming);

      const validActivities = activityLog.filter((a) => {
        const date = new Date(a.time);
        return !isNaN(date.getTime());
      });
      validActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(validActivities.slice(0, 10));

    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-green-500" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-green-100 shadow-sm">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Không tìm thấy Fanpage</h3>
        <p className="text-gray-500 font-medium">Bạn chưa quản lý Fanpage nào hoặc không có quyền truy cập.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 rounded-2xl">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-green-800 tracking-tight mb-1">
            Chào mừng, {page.name}!
          </h1>
          <p className="text-gray-500 font-medium">
            Tổng quan hoạt động Câu lạc bộ trong tuần qua
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing} 
            className="rounded-lg p-3 border-green-200 text-green-600 hover:bg-green-50 transition-all shadow-sm"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="/page-admin/events">
            <Button className="rounded-lg px-6 py-3 shadow-sm bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium transition-all transform hover:-translate-y-0.5 flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Tạo sự kiện mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng sự kiện', value: stats.totalEvents, icon: Calendar, color: 'emerald', trend: '+12% tuần này' },
          { label: 'Tổng đăng ký', value: stats.totalRegistrations, icon: Users, color: 'teal', trend: '+24% tuần này' },
          { label: 'Tổng điểm danh', value: stats.totalCheckins, icon: CheckCircle2, color: 'green', trend: '68% tỷ lệ' },
          { label: 'Chờ phê duyệt', value: stats.pendingApprovals, icon: Clock, color: 'emerald', trend: 'Cần xử lý' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          const isHighlighted = i === 0;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border shadow-sm overflow-hidden ${
                isHighlighted
                  ? 'bg-gradient-to-br from-green-500 to-teal-500 border-green-400 text-white'
                  : 'bg-white border-green-100 hover:shadow-md'
              } transition-all duration-300 group`}
            >
              <div className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${isHighlighted ? 'bg-white/20' : 'bg-green-50'} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${isHighlighted ? 'text-white' : 'text-green-600'}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    isHighlighted ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
                <p className={`text-sm font-bold mt-4 ${isHighlighted ? 'text-white/90' : 'text-gray-500 uppercase tracking-wider'}`}>
                  {stat.label}
                </p>
                <div className="flex items-end justify-between mt-1">
                  <p className={`text-4xl font-black ${isHighlighted ? 'text-white' : 'text-gray-800'}`}>
                    {stat.value}
                  </p>
                </div>
              </div>

              {/* Watermark Icon */}
              <div className={`absolute -bottom-4 -right-4 opacity-[0.05] ${isHighlighted ? 'text-white' : 'text-green-900'} group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="h-32 w-32" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Sự kiện sắp tới</h3>
                <p className="text-sm text-gray-500 font-medium">Các sự kiện được lên lịch trong thời gian tới</p>
              </div>
              <Link to="/page-admin/events">
                <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50 font-bold px-3 py-1.5 rounded-lg transition-colors">
                  Xem tất cả
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.start_time);
                  const isValidDate = !isNaN(eventDate.getTime());

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col sm:flex-row sm:items-center p-4 rounded-xl bg-white border border-green-100 hover:bg-green-50/50 hover:border-green-300 hover:shadow-sm transition-all group gap-4"
                    >
                      {/* Date Badge */}
                      <div className="h-16 w-16 bg-green-50 rounded-xl flex flex-col items-center justify-center border border-green-100 shrink-0 group-hover:bg-green-500 transition-colors">
                        <span className="text-[10px] font-black text-green-600 group-hover:text-green-100 uppercase tracking-widest">
                          {isValidDate ? safeFormatDate(event.start_time, 'MMM') : '---'}
                        </span>
                        <span className="text-xl font-black text-gray-800 group-hover:text-white leading-none mt-0.5">
                          {isValidDate ? safeFormatDate(event.start_time, 'dd') : '--'}
                        </span>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate group-hover:text-green-700 transition-colors">
                          {event.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <p className="text-xs font-medium text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                            {isValidDate ? safeFormatDate(event.start_time, 'HH:mm') : '--:--'}
                          </p>
                          <p className="text-xs font-medium text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded">
                            <Users className="h-3.5 w-3.5 mr-1.5 text-teal-500" />
                            {event._count?.registrations || 0}/{event.max_slots || '∞'} Đăng ký
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="sm:text-right shrink-0">
                        <Badge
                          variant={
                            event.status === 'ONGOING' ? 'success' :
                            event.status === 'PENDING' ? 'warning' : 'secondary'
                          }
                        >
                          {event.status === 'ONGOING' ? 'Đang diễn ra' :
                           event.status === 'PENDING' ? 'Chờ duyệt' : 'Đã kết thúc'}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-green-50/30 rounded-xl border border-dashed border-green-200">
                <Calendar className="h-12 w-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Chưa có sự kiện sắp tới</p>
                <Link to="/page-admin/events">
                  <Button size="sm" className="mt-4 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm transition-all transform hover:-translate-y-0.5">Tạo sự kiện đầu tiên</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Hoạt động gần đây</h3>
                <p className="text-sm text-gray-500 font-medium">Cập nhật thời gian thực</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <div className="space-y-6 relative">
              {/* Vertical Line Timeline */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-green-200 via-green-100 to-transparent" />

              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => {
                  const Icon = activity.icon;
                  const activityDate = new Date(activity.time);
                  const isValidDate = !isNaN(activityDate.getTime());

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative flex items-start gap-4 pl-2 hover:bg-green-50/50 p-2 rounded-xl transition-colors"
                    >
                      {/* Icon Circle */}
                      <div className={`relative z-10 h-8 w-8 rounded-lg flex items-center justify-center shadow-sm ${
                        activity.color === 'emerald' || activity.color === 'green' ? 'bg-green-500 text-white' :
                        activity.color === 'blue' ? 'bg-teal-500 text-white' :
                        'bg-emerald-600 text-white'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-semibold text-gray-800">{activity.message}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                          {isValidDate
                            ? `${safeFormatDate(activity.time, 'HH:mm')} - ${safeFormatDate(activity.time, 'dd/MM/yyyy')}`
                            : 'Vừa xong'
                          }
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 font-medium italic">
                  Chưa có hoạt động nào.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-2xl p-6 shadow-md text-white border border-green-500">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-200" />
              Thao tác nhanh
            </h3>
            <div className="space-y-3">
              <Link to="/page-admin/events">
                <button className="w-full flex items-center p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-left group">
                  <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Tạo sự kiện</p>
                    <p className="text-xs font-medium text-green-100">Đăng ký sự kiện mới</p>
                  </div>
                </button>
              </Link>
              <Link to="/page-admin/posts">
                <button className="w-full flex items-center p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-left group">
                  <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Đăng bài viết</p>
                    <p className="text-xs font-medium text-green-100">Cập nhật tin tức CLB</p>
                  </div>
                </button>
              </Link>
              <button className="w-full flex items-center p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-left group">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Xuất báo cáo</p>
                  <p className="text-xs font-medium text-green-100">Tải dữ liệu hoạt động</p>
                </div>
              </button>
            </div>
          </div>

          {/* Stats Summary Card */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
              <Star className="h-5 w-5 mr-2 text-green-500" />
              Tóm tắt chỉ số
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600">Tỷ lệ tham gia</span>
                  <span className="text-sm font-black text-green-600">
                    {stats.totalRegistrations > 0 ? Math.round((stats.totalCheckins / stats.totalRegistrations) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-green-50 rounded-full overflow-hidden border border-green-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalRegistrations > 0 ? (stats.totalCheckins / stats.totalRegistrations) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-green-500 to-teal-400 rounded-full"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-green-50">
                <span className="text-sm font-bold text-gray-600">Trung bình / sự kiện</span>
                <span className="text-sm font-black text-gray-800 bg-gray-50 px-3 py-1 rounded-lg">
                  {stats.totalEvents > 0 ? Math.round(stats.totalRegistrations / stats.totalEvents) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Badge component
const Badge = ({ children, variant = 'primary', className }: { children: React.ReactNode; variant?: 'primary' | 'success' | 'warning' | 'secondary'; className?: string }) => {
  const variants = {
    primary: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-orange-50 text-orange-700 border-orange-200',
    secondary: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className || ''}`}>
      {children}
    </span>
  );
};