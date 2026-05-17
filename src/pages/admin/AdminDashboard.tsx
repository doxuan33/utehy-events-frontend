
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Users,
  Flag,
  CalendarCheck,
  Clock,
  AlertCircle,
  BarChart3,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  Building2,
  FileText,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/admin.api';

// =====================================================================
//  Mock data dùng làm fallback khi API response thiếu trường
// =====================================================================
const FALLBACK_STATS = {
  total_users: 0,
  total_clubs: 0,
  approved_events: 0,
  pending_events: 0,
};

const MOCK_TREND_DATA = [
  { day: 'Th 2', registrations: 42 },
  { day: 'Th 3', registrations: 38 },
  { day: 'Th 4', registrations: 55 },
  { day: 'Th 5', registrations: 47 },
  { day: 'Th 6', registrations: 63 },
  { day: 'Th 7', registrations: 29 },
  { day: 'CN', registrations: 15 },
];

// =====================================================================
//  Skeleton placeholder
// =====================================================================
const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-green-100/50 ${className}`} />
);

// =====================================================================
//  Animated Counter
// =====================================================================
const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const increment = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count.toLocaleString()}</>;
};

// =====================================================================
//  Stat Card
// =====================================================================
const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  trend,
  index,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'emerald' | 'orange' | 'red';
  trend?: string;
  index: number;
}) => {
  // Thay đổi màu sắc sang dải màu xanh/teal để đồng bộ theme
  const colorMap = {
    blue: { bg: 'bg-teal-50', text: 'text-teal-600' },
    purple: { bg: 'bg-green-50', text: 'text-green-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' }, // Giữ cam/đỏ cho cảnh báo
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      className={`relative bg-white rounded-2xl border border-green-100 shadow-sm p-6
        hover:shadow-md transition-all duration-300 group overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-green-50/50 transition-all duration-500" />

      <div className="relative flex items-start justify-between">
        <div className={`h-12 w-12 rounded-xl ${c.bg} flex items-center justify-center
          group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${c.text}`} />
        </div>

        {trend && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08 + 0.3 }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold
              ${color === 'orange' || color === 'red'
                ? 'bg-orange-50 text-orange-600'
                : 'bg-green-50 text-green-700'}`}
          >
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </motion.span>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.2 }}
        className="mt-4"
      >
        <p className="text-3xl font-black text-gray-800 tracking-tight">
          <AnimatedCounter target={value} />
        </p>
        <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${c.text}`}>
          {label}
        </p>
      </motion.div>

      <div className={`absolute -bottom-3 -right-3 h-20 w-20 rounded-full opacity-10
        ${c.bg.replace('50', '200')} blur-sm transition-all duration-300
        group-hover:opacity-20`} />
    </motion.div>
  );
};

// =====================================================================
//  Pending Event Card
// =====================================================================
const PendingEventCard = ({
  event,
  index,
}: {
  event: { id: string; title: string; page_name?: string; created_at?: string; priority: 'high' | 'medium' | 'low' };
  index: number;
}) => {
  const priorityMap = {
    high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' },
    medium: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-500' },
    low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', dot: 'bg-green-500' },
  };
  const pc = priorityMap[event.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`flex items-center space-x-3 p-4 rounded-xl border ${pc.border} bg-white hover:bg-green-50/50
        shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group`}
    >
      <div className={`h-2 w-2 rounded-full shrink-0 ${pc.dot} group-hover:animate-pulse`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-700 transition-colors">{event.title}</p>
        <p className="text-[10px] text-gray-500 font-medium mt-0.5">
          {event.page_name || 'Chưa xác định'}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors shrink-0" />
    </motion.div>
  );
};

// =====================================================================
//  Activity Item
// =====================================================================
const ACTIVITY_COLORS: Record<string, string> = {
  blue: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-orange-500',
  green: 'bg-green-500',
  purple: 'bg-green-600',
  red: 'bg-red-500',
};

const ActivityItem = ({
  activity,
  index,
  isLast,
}: {
  activity: {
    id: number;
    action: string;
    detail: string;
    actor: string;
    time: string;
    icon: React.ElementType;
    color: string;
  };
  index: number;
  isLast: boolean;
}) => {
  const Icon = activity.icon;

  return (
    <div className="relative flex items-start gap-3 pb-4 hover:bg-green-50/30 p-2 rounded-lg transition-colors">
      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-green-100" />}

      <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
        ${ACTIVITY_COLORS[activity.color] || ACTIVITY_COLORS.green}`}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>

      <div className="flex-1 pt-1">
        <p className="text-sm font-semibold text-gray-800">{activity.action}</p>
        <p className="text-xs text-gray-600 mt-1">{activity.detail}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">{activity.actor}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">{activity.time}</span>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
//  Helper: generate activity log from pending events for fallback
// =====================================================================
function buildFallbackActivity(
  pendingEvents: Array<{ id: string; title: string; page_name?: string; priority: 'high' | 'medium' | 'low' }>,
) {
  return pendingEvents.map((ev, i) => ({
    id: i + 1,
    action: 'Yêu cầu phê duyệt',
    detail: ev.title,
    actor: ev.page_name || 'Hệ thống',
    time: `${i + 1} giờ trước`,
    icon: AlertCircle,
    color: 'amber',
  }));
}

// =====================================================================
//  Main Dashboard Component
// =====================================================================
export const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State: Stats cho 4 thẻ
  const [stats, setStats] = useState<{
    total_users?: number;
    total_clubs?: number;
    approved_events?: number;
    pending_events?: number;
  }>(FALLBACK_STATS);

  // State: Danh sách sự kiện chờ duyệt
  const [pendingEvents, setPendingEvents] = useState<
    Array<{ id: string; title: string; page_name?: string; created_at?: string; priority: 'high' | 'medium' | 'low' }>
  >([]);

  // Chart data – fallback là mock
  const [chartData, setChartData] = useState<Array<{ day: string; registrations: number }>>([]);

  // ─────────────────────────────────────────────────────────────────
  //  Fetch data
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Gọi đồng thời các API
      const [dashboardRes, pendingRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getPendingEvents(),
      ]);

      // Debug log
      console.log('Dashboard data:', dashboardRes.data);

      // --- Map stats ---
      const dData = dashboardRes?.data?.data || dashboardRes?.data || {};
      setStats({
        total_users: dData.total_users ?? dData.total_students ?? FALLBACK_STATS.total_users,
        total_clubs: dData.total_clubs ?? dData.total_pages ?? FALLBACK_STATS.total_clubs,
        approved_events: dData.approved_events ?? dData.total_events ?? FALLBACK_STATS.approved_events,
        pending_events: dData.pending_events ?? FALLBACK_STATS.pending_events,
      });

      // --- Map pending events ---
      const pData = pendingRes?.data?.data ?? pendingRes?.data ?? [];
      const pendingMapped: Array<typeof pendingEvents[number]> = Array.isArray(pData)
        ? pData.map((ev: any) => ({
            id: ev.id ?? String(ev._id ?? ''),
            title: ev.title ?? 'Không có tên',
            page_name: ev.page?.name ?? ev.page_name ?? 'Chưa xác định',
            created_at: ev.created_at ?? ev.submitted_at ?? undefined,
            priority: ev.priority === 'low' ? 'low' : ev.priority === 'medium' ? 'medium' : 'high',
          }))
        : [];
      setPendingEvents(pendingMapped);

      // --- Chart data (prefer API, fallback to mock) ---
      const trendRaw = dData.registration_trend ?? dData.trend ?? [];
      if (Array.isArray(trendRaw) && trendRaw.length > 0) {
        setChartData(
          trendRaw.map((item: any) => ({
            day: item.day ?? item.date ?? item.label ?? '',
            registrations: Number(item.registrations ?? item.count ?? item.value ?? 0),
          })),
        );
      } else {
        setChartData(MOCK_TREND_DATA);
      }
    } catch (err: any) {
      console.error('[Dashboard] fetch error:', err);
      setError(err?.response?.data?.message ?? 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại.');
      toast.error(err?.response?.data?.message ?? 'Lỗi tải dữ liệu. Vui lòng thử lại sau.');

      // Fallback: vẫn hiển thị mock data thay vì màn hình trắng
      setStats(FALLBACK_STATS);
      setPendingEvents([]);
      setChartData(MOCK_TREND_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  // Export training points to Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const response = await adminApi.exportTrainingPoints();
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bang-diem-ren-luyen.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Xuất báo cáo điểm rèn luyện thành công!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Xuất báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  //  Derived data
  // ─────────────────────────────────────────────────────────────────
  const statCards = useMemo(
    () => [
      {
        label: 'Tổng sinh viên',
        value: stats?.total_users ?? 0,
        icon: Users,
        color: 'blue' as const, // Rendered as Teal via colorMap
      },
      {
        label: 'Câu lạc bộ',
        value: stats?.total_clubs ?? 0,
        icon: Flag,
        color: 'purple' as const, // Rendered as Green via colorMap
      },
      {
        label: 'Sự kiện đã duyệt',
        value: stats?.approved_events ?? 0,
        icon: CalendarCheck,
        color: 'emerald' as const, // Rendered as Emerald via colorMap
      },
      {
        label: 'Chờ phê duyệt',
        value: stats?.pending_events ?? 0,
        icon: AlertCircle,
        color: 'orange' as const,
      },
    ],
    [stats],
  );

  // Hoạt động gần đây được build từ pending events + fallback mock
  const recentActivity = useMemo(() => {
    if (pendingEvents.length > 0) {
      return pendingEvents.map((ev, i) => ({
        id: i + 1,
        action: 'Yêu cầu phê duyệt',
        detail: ev.title,
        actor: ev.page_name || 'Chưa xác định',
        time: i === 0 ? 'Vừa xong' : `${i + 1} giờ trước`,
        icon: AlertCircle,
        color: 'amber',
      }));
    }
    return buildFallbackActivity([
      { id: '1', title: 'Hội thảo Lập trình Web 2026', page_name: 'CLB Lập trình', priority: 'high' },
      { id: '2', title: 'Cuộc thi AI Hackathon', page_name: 'CLB Trí tuệ Nhân tạo', priority: 'high' },
      { id: '3', title: 'Hội thao Sinh viên toàn trường', page_name: 'CLB Thể thao', priority: 'medium' },
    ]);
  }, [pendingEvents]);

  // ==================================================================
  //  RENDER
  // ==================================================================
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
          },
        },
      }}
      className="space-y-8 pb-12 bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen p-4 md:p-8 rounded-2xl"
    >
       {/* ===================== PAGE HEADER ===================== */}
       <motion.div
         variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
         className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm"
       >
         <div>
           <h1 className="text-2xl md:text-3xl font-black text-green-800 tracking-tight">
             Bảng điều khiển quản trị
           </h1>
           <p className="text-gray-500 font-medium mt-1">
             Tổng quan hoạt động hệ thống — Cập nhật theo thời gian thực
           </p>
         </div>
         <div className="flex gap-3">
           <Button
             className="rounded-lg px-6 py-2.5 shadow-sm bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600
               text-white font-medium transition-all duration-300 transform hover:-translate-y-0.5"
             onClick={handleExportExcel}
             disabled={isExporting}
           >
             {isExporting ? (
               <Loader2 className="h-5 w-5 animate-spin" />
             ) : (
               <>
                 <Download className="h-5 w-5 mr-2" />
                 Xuất báo cáo điểm RL
               </>
             )}
           </Button>
           <Link to="/admin/events">
             <Button className="rounded-lg px-6 py-2.5 shadow-sm bg-green-50 hover:bg-green-100 border border-green-500
               text-green-700 font-medium transition-all duration-300 transform hover:-translate-y-0.5">
               <FileText className="h-5 w-5 mr-2" />
               Quản lý sự kiện
             </Button>
           </Link>
         </div>
       </motion.div>

      {/* ===================== STAT CARDS GRID ===================== */}
      <section aria-label="Thông số thống kê nhanh">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
                <SkeletonBlock className="h-12 w-12 rounded-xl mb-4" />
                <SkeletonBlock className="h-4 w-24 mb-3" />
                <SkeletonBlock className="h-8 w-28" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07 } },
            }}
          >
            {statCards.map((card, i) => (
              <StatCard key={card.label} {...card} trend={
                i === 0 ? '+12% tuần này' :
                i === 1 ? '+3 tháng này' :
                i === 2 ? '+8 tháng này' :
                `${stats?.pending_events ?? 0} cần xử lý`
              } index={i} />
            ))}
          </motion.div>
        )}
      </section>

      {/* ===================== CHARTS + SIDEBAR ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ───── LEFT: Charts (lg:col-span-7 ≈ 7/12) ───── */}
        <motion.div
          className="lg:col-span-7 space-y-6"
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
        >
          {/* ── Registration Trend Chart ── */}
          <section aria-label="Biểu đồ xu hướng">
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">
                    Xu hướng tham gia
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                    Số lượng đăng ký trong 7 ngày gần nhất
                  </p>
                </div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700
                    rounded-lg text-[10px] font-bold border border-green-100"
                >
                  <TrendingUp className="h-3 w-3" />
                  +18% so với tuần trước
                </motion.span>
              </div>

              {isLoading ? (
                <div className="h-[260px] sm:h-[300px] flex items-center justify-center">
                  <SkeletonBlock className="h-full w-full rounded-2xl" />
                </div>
              ) : (
                <div className="h-[260px] sm:h-[300px] w-full mt-2">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} /> {/* emerald-500 */}
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.3} /> {/* teal-500 */}
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                          width={32}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #d1fae5',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            fontSize: 12,
                          }}
                          cursor={{ fill: '#ecfdf5' }}
                        />
                        <Bar
                          dataKey="registrations"
                          fill="url(#barGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-green-50/50 rounded-2xl
                      border border-dashed border-green-200 text-gray-500 text-sm italic">
                      Không có dữ liệu biểu đồ
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Category Distribution ── */}
          <section aria-label="Phân loại sự kiện">
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-6">
                Phân loại sự kiện
              </h3>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <SkeletonBlock className="h-full w-full rounded-2xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                  <div className="h-[180px] flex items-center justify-center">
                    <div className="relative h-40 w-40">
                      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#ecfdf5" strokeWidth="24" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#10b981" strokeWidth="24"
                          strokeDasharray="150.8 227.4" strokeLinecap="round" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#14b8a6" strokeWidth="24"
                          strokeDasharray="94.2 283" strokeLinecap="round" offset="150.8" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#34d399" strokeWidth="24"
                          strokeDasharray="75.4 302" strokeLinecap="round" offset="245" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#059669" strokeWidth="24"
                          strokeDasharray="37.7 339.7" strokeLinecap="round" offset="320.4" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-green-800">4</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Học thuật', count: 12, color: 'bg-emerald-500' },
                      { name: 'Thể thao', count: 8, color: 'bg-teal-500' },
                      { name: 'Tình nguyện', count: 15, color: 'bg-green-400' },
                      { name: 'Văn hóa - Nghệ thuật', count: 5, color: 'bg-green-700' },
                    ].map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${cat.color} shadow-sm`} />
                          <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{cat.count} sự kiện</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Participation by Faculty ── */}
          <section aria-label="Chỉ số tham gia">
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-6">
                Tỷ lệ tham gia theo khoa
              </h3>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <SkeletonBlock className="h-4 w-32" />
                      <SkeletonBlock className="h-2.5 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { name: 'Công nghệ Thông tin', value: 92, color: 'bg-emerald-500' },
                    { name: 'Kinh tế', value: 78, color: 'bg-teal-500' },
                    { name: 'Ngoại ngữ', value: 65, color: 'bg-green-400' },
                    { name: 'Cơ điện', value: 54, color: 'bg-emerald-600' },
                  ].map((item) => (
                    <div key={item.name} className="group">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 transition-colors">{item.name}</span>
                        <span className="text-sm font-black text-green-800">{item.value}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-green-50 rounded-full overflow-hidden border border-green-100">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                          className={`h-full ${item.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          {/* /.space-y-6 LEFT */}
        </motion.div>

        {/* ───── RIGHT: Sidebar (lg:col-span-5 ≈ 5/12) ───── */}
        <motion.div
          className="lg:col-span-5 space-y-6"
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
        >
          {/* ── CTA: Needs Approval ── */}
          <section aria-label="Cần xử lý ngay">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-teal-700
              p-6 sm:p-8 shadow-md">
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-10" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white opacity-5" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-green-50 text-sm font-bold uppercase tracking-wider">
                    Cần xử lý ngay
                  </span>
                </div>
                {isLoading ? (
                  <SkeletonBlock className="h-8 w-32 mb-3 bg-white/20" />
                ) : (
                  <h3 className="text-white text-2xl sm:text-3xl font-black mb-2">
                    {stats?.pending_events ?? 0} sự kiện
                  </h3>
                )}
                {!isLoading && (
                  <p className="text-green-100 text-sm leading-relaxed mb-6">
                    Có {stats?.pending_events ?? 0} sự kiện đang chờ phê duyệt. Xem xét để các hoạt động được diễn ra đúng hạn.
                  </p>
                )}
                <Link to="/admin/events">
                  <Button className="w-full bg-white text-green-700 hover:bg-green-50 rounded-lg
                    py-3 font-medium shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center">
                    Xem và duyệt sự kiện
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Pending Events List ── */}
          <section aria-label="Danh sách sự kiện cần duyệt">
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">
                  Sự kiện chờ duyệt
                </h3>
                <Link to="/admin/events">
                  <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50 font-medium rounded-lg px-3 py-1.5 transition-colors">
                    Xem tất cả
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-4 rounded-xl border border-green-50">
                      <SkeletonBlock className="h-7 w-7 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonBlock className="h-4 w-3/4" />
                        <SkeletonBlock className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingEvents.length > 0 ? (
                <div className="space-y-3">
                  {pendingEvents.map((event, i) => (
                    <PendingEventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-green-50/50 rounded-xl border border-dashed border-green-200">
                  <CalendarCheck className="h-10 w-10 text-green-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">
                    Không có sự kiện nào đang chờ duyệt
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Recent Activity Feed ── */}
          <section aria-label="Hoạt động gần đây">
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">
                  Hoạt động gần đây
                </h3>
                <div className="p-2 bg-green-50 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 pb-2">
                      <SkeletonBlock className="h-7 w-7 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <SkeletonBlock className="h-4 w-2/3" />
                        <SkeletonBlock className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-green-50">
                  {recentActivity.map((activity, i) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      index={i}
                      isLast={i === recentActivity.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Quick System Summary (dark card - adjusted to green theme) ── */}
          <section aria-label="Thông tin nhanh">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-gray-700">
              <h3 className="text-base sm:text-lg font-bold mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-400" />
                Tóm tắt hệ thống
              </h3>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <SkeletonBlock className="h-4 w-20 bg-gray-700" />
                      <SkeletonBlock className="h-4 w-12 bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <span className="text-sm text-gray-300">Tổng người dùng</span>
                      <span className="text-sm font-bold text-white">
                        {(stats?.total_users ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <span className="text-sm text-gray-300">Fanpage hoạt động</span>
                      <span className="text-sm font-bold text-white">
                        {stats?.total_clubs ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <span className="text-sm text-gray-300">Sự kiện đã duyệt</span>
                      <span className="text-sm font-bold text-white">
                        {stats?.approved_events ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 hover:bg-gray-700/50 rounded-lg transition-colors bg-green-900/20">
                      <span className="text-sm text-gray-300">Tỷ lệ duyệt</span>
                      <span className="text-sm font-bold text-green-400">
                        {stats?.approved_events != null && stats?.total_users != null
                          ? stats.total_users > 0
                            ? `${Math.round((stats.approved_events / (stats.total_users / 10) || 0) * 100)}%`
                            : 'N/A'
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <Link to="/admin/events">
                      <Button className="w-full bg-gray-800 hover:bg-gray-700 text-green-400
                        border border-green-500/30 rounded-lg py-2.5 font-medium
                        transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center">
                        Xem chi tiết báo cáo
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
          {/* /.space-y-6 RIGHT */}
        </motion.div>
      </div>
    </motion.div>
  );
};