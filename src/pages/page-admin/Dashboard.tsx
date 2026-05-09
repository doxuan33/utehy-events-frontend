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
  MessageCircle
} from 'lucide-react';
import { eventsApi } from '@/api/events.api';
import { pagesApi } from '@/api/pages.api';
import { registrationsApi } from '@/api/registrations.api';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Safe date formatter helper - prevents "Invalid time value" errors
const safeFormatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '—' : format(date, formatStr, { locale: vi });
};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
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

      // 1. Get managed page
      const pagesRes = await pagesApi.getAll();
      const managedPage = pagesRes.data.data?.[0];
      if (!managedPage) return;
      setPage(managedPage);

      // 2. Get events - handle both array and paginated response
      const eventsRes = await eventsApi.getAll({ page_id: managedPage.id, limit: 100 });
      const eventsData = eventsRes.data.data;
      const events = Array.isArray(eventsData) ? eventsData : eventsData?.data || [];

      // 3. Fetch registrations for stats
      let totalReg = 0;
      let totalCheck = 0;
      let pending = 0;
      const activityLog: any[] = [];

      for (const event of events) {
        totalReg += event._count?.registrations || 0;
        if (event.status === 'PENDING') pending++;

        // Add event creation activity
        activityLog.push({
          id: `event-${event.id}`,
          type: 'event_created',
          message: `Sự kiện "${event.title}" đã được tạo`,
          time: event.created_at,
          icon: Calendar,
          color: 'emerald'
        });

        // Fetch registrations for detailed stats
        try {
          const regRes = await registrationsApi.getEventRegistrations(event.id, managedPage.id, { limit: 50 });
          const regsData = regRes.data.data;
          const regs = Array.isArray(regsData) ? regsData : regsData?.data || [];

          regs.forEach((reg: any, idx: number) => {
            if (reg.status === 'ATTENDED') totalCheck++;

            // Add registration activity for first registrations only
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
         } catch (e) {
           // Ignore fetch errors for individual event registrations
         }
      }

      setStats({
        totalEvents: events.length,
        totalRegistrations: totalReg,
        totalCheckins: totalCheck,
        pendingApprovals: pending
      });

      // 4. Set upcoming events (sorted by date, next 5)
      const upcoming = events
        .filter((e: any) => {
          const eventDate = new Date(e.start_time);
          return !isNaN(eventDate.getTime()) && eventDate > new Date();
        })
        .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5);
      setUpcomingEvents(upcoming);

      // 5. Set recent activity (sorted by time, last 10) - filter invalid dates
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
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Không tìm thấy Fanpage</h3>
        <p className="text-gray-500">Bạn chưa quản lý Fanpage nào hoặc không có quyền truy cập.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
            Chào mừng, {page.name}!
          </h1>
          <p className="text-gray-500 font-medium">
            Tổng quan hoạt động Câu lạc bộ trong tuần qua
          </p>
        </div>
        <Link to="/page-admin/events">
          <Button className="rounded-2xl px-8 py-3 shadow-lg shadow-emerald-100 bg-emerald-500 hover:bg-emerald-600">
            <Plus className="h-5 w-5 mr-2" />
            Tạo sự kiện mới
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Tổng sự kiện',
            value: stats.totalEvents,
            icon: Calendar,
            color: 'emerald',
            bgFrom: 'from-emerald-500',
            bgTo: 'to-teal-400',
            accentClass: 'bg-emerald-500',
            trend: '+12% tuần này'
          },
          {
            label: 'Tổng đăng ký',
            value: stats.totalRegistrations,
            icon: Users,
            color: 'blue',
            bgFrom: 'from-blue-500',
            bgTo: 'to-indigo-400',
            accentClass: 'bg-blue-500',
            trend: '+24% tuần này'
          },
          {
            label: 'Tổng điểm danh',
            value: stats.totalCheckins,
            icon: CheckCircle2,
            color: 'amber',
            bgFrom: 'from-amber-500',
            bgTo: 'to-orange-400',
            accentClass: 'bg-amber-500',
            trend: '68% tỷ lệ'
          },
          {
            label: 'Chờ phê duyệt',
            value: stats.pendingApprovals,
            icon: Clock,
            color: 'rose',
            bgFrom: 'from-rose-500',
            bgTo: 'to-pink-400',
            accentClass: 'bg-rose-500',
            trend: 'Cần xử lý'
          }
        ].map((stat, i) => {
          const Icon = stat.icon;
          const isHighlighted = i === 0; // First card gets gradient background

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl border shadow-sm overflow-hidden ${
                isHighlighted
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-400 border-emerald-400 text-white'
                  : 'bg-white border-gray-100 hover:shadow-md'
              } transition-all`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${isHighlighted ? 'bg-white/20' : 'bg-gray-50'}`}>
                    <Icon className={`h-6 w-6 ${isHighlighted ? 'text-white' : `text-${stat.color}-600`}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    isHighlighted ? 'bg-white/20 text-white' : `bg-${stat.color}-50 text-${stat.color}-600`
                  }`}>
                    {stat.trend}
                  </span>
                </div>
                <p className={`text-sm font-medium mt-4 ${isHighlighted ? 'text-white/80' : 'text-gray-500'}`}>
                  {stat.label}
                </p>
                <div className="flex items-end justify-between mt-1">
                  <p className={`text-3xl font-black ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                </div>
              </div>

              {/* Icon watermark (bottom right corner) */}
              <div className={`absolute bottom-2 right-2 opacity-10 ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                <Icon className="h-16 w-16" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Events Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Sự kiện sắp tới</h3>
                <p className="text-sm text-gray-500">Các sự kiện được lên lịch trong thời gian tới</p>
              </div>
              <Link to="/page-admin/events">
                <Button variant="ghost" size="sm" className="text-emerald-600 font-bold">
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
                      className="flex items-center p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all group"
                    >
                      {/* Date Badge */}
                      <div className="h-14 w-16 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center mr-4 border border-gray-100 shrink-0">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">
                          {isValidDate ? safeFormatDate(event.start_time, 'MMM') : '---'}
                        </span>
                        <span className="text-lg font-black text-gray-900 leading-none">
                          {isValidDate ? safeFormatDate(event.start_time, 'dd') : '--'}
                        </span>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {isValidDate ? safeFormatDate(event.start_time, 'HH:mm') : '--:--'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {event._count?.registrations || 0}/{event.max_slots || '∞'}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="text-right">
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
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Chưa có sự kiện sắp tới</p>
                <Link to="/page-admin/events">
                  <Button size="sm" className="mt-4 rounded-xl">Tạo sự kiện đầu tiên</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Hoạt động gần đây</h3>
                <p className="text-sm text-gray-500">Cập nhật thời gian thực</p>
              </div>
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="space-y-6 relative">
              {/* Vertical Line Timeline */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-200 via-emerald-100 to-transparent" />

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
                      className="relative flex items-start gap-4 pl-2"
                    >
                      {/* Icon Circle */}
                      <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${
                        activity.color === 'emerald' ? 'bg-emerald-500 text-white' :
                        activity.color === 'blue' ? 'bg-blue-500 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
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
                <div className="text-center py-8 text-gray-400 italic">
                  Chưa có hoạt động nào.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-6 shadow-lg text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Thao tác nhanh
            </h3>
            <div className="space-y-3">
              <Link to="/page-admin/events">
                <button className="w-full flex items-center p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-left group">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Tạo sự kiện</p>
                    <p className="text-[10px] text-emerald-100">Đăng ký sự kiện mới</p>
                  </div>
                </button>
              </Link>
              <Link to="/page-admin/posts">
                <button className="w-full flex items-center p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-left group">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Đăng bài viết</p>
                    <p className="text-[10px] text-emerald-100">Cập nhật tin tức CLB</p>
                  </div>
                </button>
              </Link>
              <button className="w-full flex items-center p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-left group">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Xuất báo cáo</p>
                  <p className="text-[10px] text-emerald-100">Tải dữ liệu hoạt động</p>
                </div>
              </button>
            </div>
          </div>

          {/* Stats Summary Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt nhanh</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tỷ lệ tham gia</span>
                <span className="text-sm font-bold text-emerald-600">
                  {stats.totalRegistrations > 0 ? Math.round((stats.totalCheckins / stats.totalRegistrations) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.totalRegistrations > 0 ? (stats.totalCheckins / stats.totalRegistrations) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-600">Trung bình/ sự kiện</span>
                <span className="text-sm font-bold text-gray-900">
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
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    secondary: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className || ''}`}>
      {children}
    </span>
  );
};
