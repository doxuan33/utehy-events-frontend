import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { registrationsApi } from '@/api/registrations.api';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Award,
  MapPin,
  QrCode,
  X,
  LayoutList
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { QRCodeSVG } from 'qrcode.react';

interface Registration {
  id: string;
  status: string;
  created_at: string;
  event?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    training_points?: number;
    _count?: {
      registrations: number;
    };
  };
}

type TabMode = 'upcoming' | 'history';
type ViewMode = 'list' | 'calendar';
type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { vi },
});

export const MyEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabMode>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQr, setSelectedQr] = useState<string | null>(null);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarViewMode>(Views.MONTH as CalendarViewMode);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && calendarView === Views.MONTH) {
        setCalendarView(Views.AGENDA as CalendarViewMode);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [calendarView]);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await registrationsApi.getMyRegistrations({ limit: 50 });
        const data = res.data.data;
        const allRegs = Array.isArray(data) ? data : data.data || [];
        setRegistrations(allRegs);
      } catch (err) {
        console.error('Failed to fetch my events', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  const now = new Date();

  // Hàm tính toán lại trạng thái dựa vào thời gian thực tế
  const getDerivedStatus = (reg: Registration) => {
    const endTime = new Date(reg.event?.end_time || reg.event?.start_time || reg.created_at);
    
    // Nếu sự kiện đã kết thúc mà trạng thái vẫn là REGISTERED (chưa điểm danh) => Vắng mặt
    if (reg.status === 'REGISTERED' && now >= endTime) {
      return 'ABSENT';
    }
    return reg.status;
  };
  
  const upcomingEvents = useMemo(() => registrations.filter(reg => {
    const endTime = new Date(reg.event?.end_time || reg.event?.start_time || reg.created_at);
    return now < endTime; 
  }), [registrations, now]);

  const pastEvents = useMemo(() => registrations.filter(reg => {
    const endTime = new Date(reg.event?.end_time || reg.event?.start_time || reg.created_at);
    return now >= endTime; 
  }), [registrations, now]);

  const totalEvents = registrations.length;
  const totalPoints = useMemo(() => registrations
    .filter(r => getDerivedStatus(r) === 'ATTENDED')
    .reduce((sum, r) => sum + (r.event?.training_points || 0), 0), [registrations, now]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return { variant: 'success' as const, label: 'Đã tham gia', className: 'bg-green-50 text-green-700 border border-green-200' };
      case 'ABSENT':
        return { variant: 'danger' as const, label: 'Vắng mặt', className: 'bg-red-50 text-red-700 border border-red-200' };
      case 'CANCELLED':
        return { variant: 'secondary' as const, label: 'Đã hủy', className: 'bg-gray-50 text-gray-700 border border-gray-200' };
      case 'REGISTERED':
      default:
        // Đổi sang màu vàng cho trạng thái chờ tham gia (sự kiện sắp tới)
        return { variant: 'warning' as const, label: 'Chờ tham gia', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' };
    }
  };

  const getQrValue = (reg: Registration) => {
    return user?.student_id || reg.id;
  };

  const calendarEvents = useMemo(() => registrations.map((reg: any) => ({
    id: reg.id,
    title: reg.event?.title || 'Sự kiện UTEHY',
    start: new Date(reg.event?.start_time),
    end: new Date(reg.event?.end_time || reg.event?.start_time),
    resource: reg,
  })), [registrations]);

  const eventPropGetter = (event: any) => {
    const status = getDerivedStatus(event.resource);
    
    if (status === 'ATTENDED') return { style: { backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' } }; // green-500
    if (status === 'ABSENT') return { style: { backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' } }; // red-500
    if (status === 'CANCELLED') return { style: { backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px' } }; // gray-400
    
    // Sự kiện sắp tới (REGISTERED) -> Màu vàng
    return { style: { backgroundColor: '#eab308', color: 'white', border: 'none', borderRadius: '4px' } }; // yellow-500
  };

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-24 px-3 sm:px-6 pt-2 sm:pt-4">
      
      <style dangerouslySetInnerHTML={{__html: `
        /* Custom UI for React Big Calendar */
        .rbc-today { background-color: #ecfdf5 !important; }
        .rbc-event { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .rbc-btn-group button.rbc-active { background-color: #10b981 !important; color: white !important; border-color: #10b981 !important; box-shadow: none !important; }
        .rbc-btn-group button:hover:not(.rbc-active) { background-color: #d1fae5 !important; color: #047857 !important; }
        
        /* Mobile specific fixes */
        @media (max-width: 768px) {
          .rbc-toolbar { flex-direction: column; gap: 8px; margin-bottom: 12px; }
          .rbc-toolbar .rbc-btn-group { display: flex; width: 100%; justify-content: center; }
          .rbc-toolbar button { padding: 6px 12px; font-size: 13px; flex: 1; }
          .rbc-toolbar .rbc-toolbar-label { font-size: 16px; font-weight: 800; color: #065f46; }
          .rbc-agenda-view table.rbc-agenda-table { font-size: 13px; }
          .rbc-agenda-date-cell { white-space: nowrap; font-weight: bold; color: #047857; }
          .rbc-btn-group:nth-child(3) button:not(:last-child) { display: none; }
        }
      `}} />

      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-green-50 rounded-xl transition-colors shrink-0 bg-white shadow-sm sm:shadow-none sm:bg-transparent border border-gray-100 sm:border-transparent text-gray-500 hover:text-green-600"
        >
          <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-teal-600 tracking-tight">Sự kiện của tôi</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 font-medium line-clamp-1">Quản lý và theo dõi lịch trình tham gia</p>
        </div>
      </div>

      {/* Mini Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 sm:gap-4"
      >
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-3xl p-4 sm:p-6 border border-green-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <p className="text-[10px] sm:text-xs text-green-700 font-bold uppercase tracking-wider">Tổng sự kiện</p>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-800 leading-none">{totalEvents}</p>
        </div>
        
        <div className="bg-gradient-to-br from-teal-500 to-green-500 rounded-3xl p-4 sm:p-6 shadow-md shadow-green-500/20 flex flex-col justify-between group hover:shadow-lg hover:shadow-green-500/30 transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10"><CheckCircle2 className="w-24 h-24 text-white" /></div>
          <div className="flex items-center justify-between mb-2 sm:mb-0 relative z-10">
            <p className="text-[10px] sm:text-xs text-green-50 font-bold uppercase tracking-wider">Điểm Rèn luyện</p>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white leading-none relative z-10">{totalPoints}</p>
        </div>
      </motion.div>

      {/* View Toggle */}
      <div className="bg-white p-1.5 rounded-2xl flex relative w-full sm:w-64 border border-green-100 shadow-sm">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all z-10 ${
            viewMode === 'list' ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <LayoutList className="h-4 w-4" />
          <span>Danh sách</span>
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all z-10 ${
            viewMode === 'calendar' ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Lịch trình</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-green-50/50 rounded-3xl animate-pulse border border-green-100" />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        /* ================= CALENDAR VIEW ================= */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[24px] shadow-sm border border-green-100 p-3 sm:p-6 h-[500px] sm:h-[600px] flex flex-col overflow-hidden"
        >
          {/* Chú thích màu lịch trình */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 justify-end text-[11px] sm:text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#eab308]"></div> Chờ tham gia</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#10b981]"></div> Đã tham gia</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#ef4444]"></div> Vắng mặt</div>
          </div>

          <div className="flex-1 h-full w-full">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', fontFamily: 'inherit' }}
              date={calendarDate}
              onNavigate={(newDate) => setCalendarDate(newDate)}
              view={calendarView}
              onView={(newView) => setCalendarView(newView as CalendarViewMode)}
              messages={{
                next: 'Sau',
                previous: 'Trước',
                today: 'Hôm nay',
                month: 'Tháng',
                week: 'Tuần',
                day: 'Ngày',
                agenda: 'Lịch trình',
                showMore: (total) => `+${total} nữa`,
                noEventsInRange: 'Không có sự kiện nào trong khoảng thời gian này.',
                event: 'Sự kiện',
                date: 'Ngày',
                time: 'Thời gian'
              }}
              culture="vi"
              eventPropGetter={eventPropGetter}
              views={isMobile ? [Views.AGENDA] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              popup
            />
          </div>
        </motion.div>
      ) : (
        /* ================= LIST VIEW ================= */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 sm:space-y-5"
        >
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 mb-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === 'upcoming' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sắp diễn ra <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{upcomingEvents.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === 'history' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Lịch sử tham gia <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'history' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{pastEvents.length}</span>
            </button>
          </div>

          {displayedEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-10 text-center border border-dashed border-green-200 shadow-sm mt-6"
            >
              <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <CalendarIcon className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Chưa có dữ liệu</h3>
              <p className="text-sm text-gray-500 mb-6 px-4 font-medium">
                {activeTab === 'upcoming'
                  ? 'Bạn chưa đăng ký sự kiện nào sắp tới. Hãy tìm kiếm sự kiện mới nhé!'
                  : 'Bạn chưa có lịch sử tham gia sự kiện nào.'}
              </p>
              <Link to="/events">
                <Button className="rounded-xl px-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 border-none">
                  Khám phá sự kiện ngay
                </Button>
              </Link>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayedEvents.map((reg) => {
                const event = reg.event;
                const eventDate = new Date(event?.start_time || reg.created_at);
                
                // Lấy trạng thái đã được tính toán lại (Tự động vắng mặt nếu quá hạn)
                const derivedStatus = getDerivedStatus(reg);
                const statusBadge = getStatusBadge(derivedStatus);
                const points = event?.training_points || 0;
                
                const endTime = new Date(event?.end_time || event?.start_time || reg.created_at);
                const isUpcoming = now < endTime; 

                return (
                  <motion.div
                    key={reg.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white rounded-2xl sm:rounded-3xl border border-green-100 overflow-hidden shadow-sm hover:shadow-md transition-all relative group ${!isUpcoming ? 'opacity-80' : ''}`}
                  >
                    <div className="flex flex-row relative min-h-[120px] sm:min-h-[140px]">
                      {/* Trái - Thông tin sự kiện */}
                      <div className="flex-1 p-4 sm:p-6 pr-5 sm:pr-8 flex flex-col justify-center">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
                          {event?.title}
                        </h3>

                        <div className="space-y-2 sm:space-y-2.5">
                          <div className="flex items-start text-xs sm:text-sm text-gray-600 font-medium">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-teal-500 shrink-0 mt-[1px]" />
                            <span className="line-clamp-1">
                              {format(eventDate, 'dd/MM/yyyy • HH:mm', { locale: vi })}
                            </span>
                          </div>

                          {event?.location && (
                            <div className="flex items-start text-xs sm:text-sm text-gray-600 font-medium">
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-green-500 shrink-0 mt-[1px]" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}

                          {points > 0 && (
                            <div className="flex items-center text-[10px] sm:text-xs text-green-700 bg-green-50 w-fit px-2.5 py-1 rounded-md mt-1 border border-green-100 font-bold">
                              <Award className="h-3.5 w-3.5 mr-1" />
                              +{points} ĐRL
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phải - Hành động & Nét đứt */}
                      <div className="w-[90px] sm:w-[140px] p-3 sm:p-5 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center space-y-3 sm:space-y-4 shrink-0 border-l-2 border-dashed border-gray-200 relative">
                        
                        <div className="absolute -top-[14px] -left-[14px] w-7 h-7 bg-white rounded-full border-b border-gray-200"></div>
                        <div className="absolute -bottom-[14px] -left-[14px] w-7 h-7 bg-white rounded-full border-t border-gray-200"></div>

                        {event && (
                          <Badge
                            variant={statusBadge.variant}
                            className={`px-2 sm:px-3 py-1.5 text-[9px] sm:text-xs font-bold text-center w-full justify-center shadow-sm ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </Badge>
                        )}

                        {event && isUpcoming && derivedStatus === 'REGISTERED' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedQr(getQrValue(reg))}
                            className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white shadow-sm h-8 sm:h-10 px-0 flex items-center justify-center transition-transform hover:scale-105 border-none"
                          >
                            <QrCode className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline text-xs font-bold">Mã QR</span>
                          </Button>
                        )}

                        {event && (
                          <Link to={`/events/${event.id}`} className="w-full">
                            <Button variant="ghost" size="sm" className="w-full h-8 sm:h-10 rounded-xl text-gray-600 font-bold text-[10px] sm:text-xs bg-white border border-gray-200 hover:bg-gray-50 px-0 transition-colors shadow-sm">
                              Chi tiết
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {/* Modal QR Code */}
      <AnimatePresence>
        {selectedQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setSelectedQr(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-[340px] sm:max-w-sm w-full relative shadow-2xl border border-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedQr(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>

              <div className="text-center mb-6 mt-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-800">Mã Điểm Danh</h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Đưa mã này cho BTC quét tại quầy</p>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-4 sm:p-5 bg-white rounded-[24px] shadow-[0_0_40px_rgba(234,179,8,0.2)] border-2 border-yellow-100">
                  <QRCodeSVG value={selectedQr} size={220} className="w-full max-w-[220px] h-auto" />
                </div>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100 flex gap-3 items-start">
                <div className="p-1 bg-orange-100 rounded-lg shrink-0 mt-0.5"><Clock className="w-4 h-4 text-orange-600"/></div>
                <p className="text-left text-[11px] sm:text-xs font-semibold text-orange-800 leading-snug">
                  Hãy tăng độ sáng màn hình lên mức tối đa để việc quét mã QR diễn ra nhanh chóng.
                </p>
              </div>

              <Button
                onClick={() => setSelectedQr(null)}
                className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white py-3.5 sm:py-4 font-bold text-sm sm:text-base shadow-sm border-none"
              >
                Đóng
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};