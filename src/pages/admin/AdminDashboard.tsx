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
  <div className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />
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
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      className={`relative bg-white rounded-3xl border border-gray-100 shadow-sm p-6
        hover:shadow-lg transition-all duration-300 group overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-current/5 transition-all duration-500" />

      <div className="relative flex items-start justify-between">
        <div className={`h-12 w-12 rounded-2xl ${c.bg} flex items-center justify-center
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
                : 'bg-emerald-50 text-emerald-600'}`}
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
        <p className="text-3xl font-black text-gray-900 tracking-tight">
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
    high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' },
    low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
  };
  const pc = priorityMap[event.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`flex items-center space-x-3 p-4 rounded-2xl border ${pc.border} ${pc.bg}
        hover:shadow-sm transition-all cursor-pointer group`}
    >
      <div className={`h-2 w-2 rounded-full shrink-0 ${pc.dot} group-hover:animate-pulse`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
        <p className="text-[10px] text-gray-500 font-medium mt-0.5">
          {event.page_name || 'Chưa xác định'}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
    </motion.div>
  );
};

// =====================================================================
//  Activity Item
// =====================================================================
const ACTIVITY_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
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
    <div className="relative flex items-start gap-3 pb-2">
      {!isLast && <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-100" />}

      <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center shrink-0
        ${ACTIVITY_COLORS[activity.color] || ACTIVITY_COLORS.blue}`}
      >
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>

      <div className="flex-1 pt-0.5 pb-2">
        <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
        <p className="text-xs text-gray-500 mt-0.5">{activity.detail}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-400 font-medium">{activity.actor}</span>
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
        color: 'blue' as const,
      },
      {
        label: 'Câu lạc bộ',
        value: stats?.total_clubs ?? 0,
        icon: Flag,
        color: 'purple' as const,
      },
      {
        label: 'Sự kiện đã duyệt',
        value: stats?.approved_events ?? 0,
        icon: CalendarCheck,
        color: 'emerald' as const,
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
      className="space-y-8 pb-12"
    >
       {/* ===================== PAGE HEADER ===================== */}
       <motion.div
         variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
         className="flex flex-col md:flex-row md:items-center justify-between gap-4"
       >
         <div>
           <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
             Bảng điều khiển quản trị
           </h1>
           <p className="text-gray-500 font-medium mt-1">
             Tổng quan hoạt động hệ thống — Cập nhật theo thời gian thực
           </p>
         </div>
         <div className="flex gap-3">
           <Button
             className="rounded-2xl px-6 py-3 shadow-lg shadow-emerald-100 bg-emerald-500 hover:bg-emerald-600
               text-white font-semibold transition-all duration-300"
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
             <Button className="rounded-2xl px-6 py-3 shadow-sm bg-blue-600 hover:bg-blue-700
               text-white font-semibold transition-all duration-300">
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
              <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <SkeletonBlock className="h-12 w-12 rounded-2xl mb-4" />
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Xu hướng tham gia
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                    Số lượng đăng ký trong 7 ngày gần nhất
                  </p>
                </div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600
                    rounded-lg text-[10px] font-bold"
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
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                          width={32}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                            fontSize: 12,
                          }}
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
                    <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-2xl
                      border border-dashed border-gray-200 text-gray-400 text-sm italic">
                      Không có dữ liệu biểu đồ
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Category Distribution ── */}
          <section aria-label="Phân loại sự kiện">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-6">
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
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#f1f5f9" strokeWidth="24" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#2563eb" strokeWidth="24"
                          strokeDasharray="150.8 227.4" strokeLinecap="round" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#7c3aed" strokeWidth="24"
                          strokeDasharray="94.2 283" strokeLinecap="round" offset="150.8" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#10b981" strokeWidth="24"
                          strokeDasharray="75.4 302" strokeLinecap="round" offset="245" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#f59e0b" strokeWidth="24"
                          strokeDasharray="37.7 339.7" strokeLinecap="round" offset="320.4" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-gray-900">4</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'Học thuật', count: 12, color: 'bg-blue-500' },
                      { name: 'Thể thao', count: 8, color: 'bg-purple-500' },
                      { name: 'Tình nguyện', count: 15, color: 'bg-emerald-500' },
                      { name: 'Văn hóa - Nghệ thuật', count: 5, color: 'bg-amber-500' },
                    ].map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                          <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{cat.count} sự kiện</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Participation by Faculty ── */}
          <section aria-label="Chỉ số tham gia">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-6">
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
                <div className="space-y-5">
                  {[
                    { name: 'Công nghệ Thông tin', value: 92, color: 'bg-blue-500' },
                    { name: 'Kinh tế', value: 78, color: 'bg-emerald-500' },
                    { name: 'Ngoại ngữ', value: 65, color: 'bg-purple-500' },
                    { name: 'Cơ điện', value: 54, color: 'bg-amber-500' },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <span className="text-sm font-black text-gray-900">{item.value}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600
              p-6 sm:p-8 shadow-xl shadow-orange-200/40">
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-10" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white opacity-5" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="h-6 w-6 text-white/90" />
                  <span className="text-white/80 text-sm font-bold uppercase tracking-wider">
                    Cần xử lý ngay
                  </span>
                </div>
                {isLoading ? (
                  <SkeletonBlock className="h-8 w-32 mb-3" />
                ) : (
                  <h3 className="text-white text-xl sm:text-2xl font-black mb-2">
                    {stats?.pending_events ?? 0} sự kiện
                  </h3>
                )}
                {!isLoading && (
                  <p className="text-orange-100 text-sm leading-relaxed mb-6">
                    Có {stats?.pending_events ?? 0} sự kiện đang chờ phê duyệt. Xử lý ngay để đảm bảo tiến độ.
                  </p>
                )}
                <Link to="/admin/events">
                  <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 rounded-2xl
                    py-3.5 font-bold shadow-lg shadow-black/10 transition-all duration-300">
                    Xem và duyệt sự kiện
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Pending Events List ── */}
          <section aria-label="Danh sách sự kiện cần duyệt">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Sự kiện chờ duyệt
                </h3>
                <Link to="/admin/events">
                  <Button variant="ghost" size="sm" className="text-blue-600 font-medium">
                    Xem tất cả
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-4 rounded-2xl border border-gray-100">
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
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <CalendarCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">
                    Không có sự kiện nào đang chờ duyệt
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Recent Activity Feed ── */}
          <section aria-label="Hoạt động gần đây">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Hoạt động gần đây
                </h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
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
                <div className="divide-y divide-gray-100">
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

          {/* ── Quick System Summary (dark card) ── */}
          <section aria-label="Thông tin nhanh">
            <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
              <h3 className="text-base sm:text-lg font-bold mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tóm tắt hệ thống
              </h3>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <SkeletonBlock className="h-4 w-20" />
                      <SkeletonBlock className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Tổng người dùng</span>
                      <span className="text-sm font-bold">
                        {(stats?.total_users ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Fanpage hoạt động</span>
                      <span className="text-sm font-bold">
                        {stats?.total_clubs ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Sự kiện đã duyệt</span>
                      <span className="text-sm font-bold">
                        {stats?.approved_events ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Tỷ lệ duyệt</span>
                      <span className="text-sm font-bold text-emerald-400">
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
                      <Button className="w-full bg-white/10 hover:bg-white/20 text-white
                        border border-white/20 rounded-2xl py-3 font-semibold
                        transition-all duration-300">
                        Xem chi tiết báo cáo
                        <ArrowUpRight className="h-4 w-4 ml-1" />
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