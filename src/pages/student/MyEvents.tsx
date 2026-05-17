import { useEffect, useState } from 'react';
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
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
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
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('month');

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
  
  const upcomingEvents = registrations.filter(reg => {
    const endTime = new Date(reg.event?.end_time || reg.event?.start_time || reg.created_at);
    return now < endTime; 
  });

  const pastEvents = registrations.filter(reg => {
    const endTime = new Date(reg.event?.end_time || reg.event?.start_time || reg.created_at);
    return now >= endTime; 
  });

  const totalEvents = registrations.length;
  const totalPoints = registrations
    .filter(r => r.status === 'ATTENDED')
    .reduce((sum, r) => sum + (r.event?.training_points || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return { variant: 'success' as const, label: 'Đã tham gia', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' };
      case 'ABSENT':
        return { variant: 'danger' as const, label: 'Vắng mặt', className: 'bg-red-100 text-red-700 border border-red-200' };
      case 'CANCELLED':
        return { variant: 'secondary' as const, label: 'Đã hủy', className: 'bg-gray-100 text-gray-700 border border-gray-200' };
      case 'REGISTERED':
      default:
        return { variant: 'primary' as const, label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700 border border-amber-200' };
    }
  };

  const getQrValue = (reg: Registration) => {
    return user?.student_id || reg.id;
  };

  const calendarEvents = registrations.map((reg: any) => ({
    id: reg.id,
    title: reg.event?.title || 'Sự kiện UTEHY',
    start: new Date(reg.event?.start_time),
    end: new Date(reg.event?.end_time),
    resource: reg,
  }));

  const eventPropGetter = (event: any) => {
    const status = event.resource?.status;
    if (status === 'ATTENDED') return { style: { backgroundColor: '#10b981', color: 'white', border: 'none' } }; 
    if (status === 'ABSENT') return { style: { backgroundColor: '#ef4444', color: 'white', border: 'none' } }; 
    return { style: { backgroundColor: '#3b82f6', color: 'white', border: 'none' } }; 
  };

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-24 px-3 sm:px-6 pt-2 sm:pt-4">
      
      {/* CSS fix Lịch trên Mobile */}
      <style>{`
        @media (max-width: 640px) {
          .rbc-toolbar {
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
          }
          .rbc-toolbar .rbc-btn-group {
            display: flex;
            width: 100%;
            justify-content: center;
          }
          .rbc-toolbar button {
            padding: 4px 10px;
            font-size: 12px;
            flex: 1;
          }
          .rbc-toolbar .rbc-toolbar-label {
            font-size: 14px;
            font-weight: 700;
          }
          .rbc-header {
            font-size: 11px;
            padding: 4px 0;
          }
          .rbc-event {
            font-size: 10px;
            padding: 2px 4px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0 bg-white shadow-sm sm:shadow-none sm:bg-transparent"
        >
          <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Sự kiện của tôi</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 font-medium line-clamp-1">Quản lý và theo dõi lịch trình tham gia</p>
        </div>
      </div>

      {/* Mini Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 sm:gap-4"
      >
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[20px] p-3 sm:p-5 border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Tổng sự kiện</p>
            <div className="h-8 w-8 sm:h-12 sm:w-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <CalendarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{totalEvents}</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[20px] p-3 sm:p-5 border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Điểm Rèn luyện</p>
            <div className="h-8 w-8 sm:h-12 sm:w-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Award className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 leading-none">{totalPoints}</p>
        </div>
      </motion.div>

      {/* View Toggle (List vs Calendar) */}
      <div className="bg-gray-100 p-1.5 rounded-[18px] flex relative w-full sm:w-64">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all z-10 ${
            viewMode === 'list' ? 'text-emerald-700 shadow-sm bg-white' : 'text-gray-500'
          }`}
        >
          <LayoutList className="h-4 w-4" />
          <span>Danh sách</span>
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all z-10 ${
            viewMode === 'calendar' ? 'text-emerald-700 shadow-sm bg-white' : 'text-gray-500'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Lịch trình</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        
        /* ================= CALENDAR VIEW ================= */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-3 sm:p-6 h-[500px] sm:h-[600px] flex flex-col overflow-hidden"
        >
          <div className="flex-1 h-full w-full">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
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
                noEventsInRange: 'Trống',
              }}
              culture="vi"
              eventPropGetter={eventPropGetter}
              views={['month', 'week', 'day', 'agenda']}
              popup
            />
          </div>
        </motion.div>
      ) : (
        /* ================= LIST VIEW (TICKETS) ================= */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 sm:space-y-5"
        >
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-[3px] transition-colors ${
                activeTab === 'upcoming' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sắp diễn ra <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">{upcomingEvents.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-[3px] transition-colors ${
                activeTab === 'history' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lịch sử <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">{pastEvents.length}</span>
            </button>
          </div>

          {displayedEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[24px] p-8 text-center border border-gray-100 shadow-sm mt-6"
            >
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Chưa có dữ liệu</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 px-4">
                {activeTab === 'upcoming'
                  ? 'Bạn chưa có sự kiện nào sắp tới. Hãy tìm kiếm sự kiện mới nhé!'
                  : 'Bạn chưa có lịch sử tham gia sự kiện nào.'}
              </p>
              <Link to="/events">
                <Button className="rounded-xl px-6 bg-emerald-500 hover:bg-emerald-600 text-xs sm:text-sm">Khám phá sự kiện</Button>
              </Link>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayedEvents.map((reg) => {
                const event = reg.event;
                const eventDate = new Date(event?.start_time || reg.created_at);
                const statusBadge = getStatusBadge(reg.status);
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
                    className={`bg-white rounded-2xl sm:rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${!isUpcoming ? 'opacity-75' : ''}`}
                  >
                    {/* --- CẤU TRÚC VÉ (RESPONSIVE FLEXBOX) --- */}
                    <div className="flex flex-row relative min-h-[120px] sm:min-h-[140px]">
                      
                      {/* Trái - Thông tin sự kiện */}
                      <div className="flex-1 p-3 sm:p-5 pr-4 sm:pr-6 flex flex-col justify-center">
                        <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
                          {event?.title}
                        </h3>

                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex items-start text-[11px] sm:text-sm text-gray-600">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 text-emerald-600 shrink-0 mt-[2px]" />
                            <span className="font-medium line-clamp-1">
                              {format(eventDate, 'dd/MM/yyyy • HH:mm', { locale: vi })}
                            </span>
                          </div>

                          {event?.location && (
                            <div className="flex items-start text-[11px] sm:text-sm text-gray-600">
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 text-red-500 shrink-0 mt-[2px]" />
                              <span className="font-medium line-clamp-1">{event.location}</span>
                            </div>
                          )}

                          {points > 0 && (
                            <div className="flex items-center text-[10px] sm:text-xs text-emerald-700 bg-emerald-50 w-fit px-2 py-0.5 rounded mt-1 border border-emerald-100">
                              <Award className="h-3 w-3 mr-1" />
                              <span className="font-bold">+{points} ĐRL</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phải - Hành động & Nét đứt (Tear Line) */}
                      {/* Gắn viền đứt vào cột phải để dễ canh vị trí lỗ cắt */}
                      <div className="w-[85px] sm:w-[130px] p-2 sm:p-4 bg-gray-50/50 flex flex-col items-center justify-center space-y-2 sm:space-y-3 shrink-0 border-l-2 border-dashed border-gray-200 relative">
                        
                        {/* 2 Lỗ tròn cắt vé */}
                        <div className="absolute -top-[13px] -left-[13px] w-6 h-6 bg-gray-50 sm:bg-white rounded-full border-b border-gray-200"></div>
                        <div className="absolute -bottom-[13px] -left-[13px] w-6 h-6 bg-gray-50 sm:bg-white rounded-full border-t border-gray-200"></div>

                        {event && (
                          <Badge
                            variant={statusBadge.variant}
                            className={`px-1 sm:px-3 text-[9px] sm:text-xs font-bold text-center w-full justify-center ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </Badge>
                        )}

                        {event && isUpcoming && reg.status === 'REGISTERED' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedQr(getQrValue(reg))}
                            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-sm h-8 sm:h-9 px-0 flex items-center justify-center"
                          >
                            <QrCode className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline text-xs">Mã QR</span>
                          </Button>
                        )}

                        {event && (
                          <Link to={`/events/${event.id}`} className="w-full">
                            <Button variant="ghost" size="sm" className="w-full h-8 sm:h-9 rounded-xl text-emerald-600 font-bold text-[10px] sm:text-xs bg-white border border-emerald-100 hover:bg-emerald-50 px-0">
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setSelectedQr(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-[28px] p-5 sm:p-8 max-w-[320px] sm:max-w-sm w-full relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedQr(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </button>

              <div className="text-center mb-5 mt-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">Mã Điểm Danh</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Sử dụng mã này tại quầy check-in</p>
              </div>

              <div className="flex justify-center mb-5">
                <div className="p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.08)] border border-gray-100">
                  <QRCodeSVG value={selectedQr} size={200} className="w-full max-w-[200px] h-auto" />
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 border border-amber-100">
                <p className="text-center text-[11px] sm:text-sm font-semibold text-amber-700 leading-snug">
                  Vui lòng tăng độ sáng màn hình để Ban tổ chức quét mã dễ dàng hơn.
                </p>
              </div>

              <Button
                onClick={() => setSelectedQr(null)}
                className="w-full rounded-xl sm:rounded-2xl bg-gray-900 hover:bg-gray-800 text-white py-3 sm:py-4 font-bold text-sm sm:text-base"
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