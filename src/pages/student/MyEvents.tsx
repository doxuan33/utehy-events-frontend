import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { registrationsApi } from '@/api/registrations.api';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Award,
  QrCode,
  MapPin,
  Users
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format, isAfter, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';

type TabMode = 'upcoming' | 'history';

export const MyEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabMode>('upcoming');

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

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = registrations.filter(reg => {
    const eventDate = new Date(reg.event?.start_time || reg.created_at);
    return isAfter(eventDate, now) || reg.status === 'REGISTERED';
  });

  const pastEvents = registrations.filter(reg => {
    const eventDate = new Date(reg.event?.start_time || reg.created_at);
    return isBefore(eventDate, now) && reg.status !== 'REGISTERED';
  });

  // Calculate stats
  const totalEvents = registrations.length;
  const totalPoints = registrations
    .filter(r => r.status === 'ATTENDED')
    .reduce((sum, r) => sum + (r.event?.training_points || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return {
          variant: 'success' as const,
          label: 'Đã tham gia',
          className: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        };
      case 'ABSENT':
        return { variant: 'danger' as const, label: 'Vắng mặt', className: '' };
      case 'CANCELLED':
        return { variant: 'secondary' as const, label: 'Đã hủy', className: '' };
      case 'REGISTERED':
      default:
        return {
          variant: 'primary' as const,
          label: 'Đã đăng ký',
          className: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        };
    }
  };

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sự kiện của tôi</h1>
          <p className="text-sm text-gray-500 font-medium">Quản lý và theo dõi các sự kiện bạn đã đăng ký</p>
        </div>
      </div>

      {/* Mini Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tổng sự kiện</p>
              <p className="text-3xl font-black text-gray-900">{totalEvents}</p>
            </div>
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tổng điểm RL</p>
              <p className="text-3xl font-black text-emerald-600">{totalPoints}</p>
            </div>
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="bg-gray-100 rounded-2xl p-1 flex">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Sắp diễn ra</span>
          <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
            {upcomingEvents.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Lịch sử</span>
          <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">
            {pastEvents.length}
          </span>
        </button>
      </div>

      {/* Event List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-white rounded-3xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl p-12 text-center border border-gray-100"
        >
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có sự kiện</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'upcoming'
              ? 'Bạn chưa đăng ký sự kiện nào sắp tới. Khám phá ngay!'
              : 'Bạn chưa tham gia sự kiện nào.'}
          </p>
          <Link to="/events">
            <Button className="rounded-xl px-8 bg-emerald-500 hover:bg-emerald-600">
              Khám phá sự kiện
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          <AnimatePresence mode="popLayout">
            {displayedEvents.map((reg) => {
              const event = reg.event;
              const eventDate = new Date(event?.start_time || reg.created_at);
              const statusBadge = getStatusBadge(reg.status);
              const isUpcoming = isAfter(eventDate, now) || reg.status === 'REGISTERED';

              return (
                <motion.div
                  key={reg.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Event Banner */}
                  <div className="relative h-32 bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden">
                    {event?.banner_url ? (
                      <img
                        src={event.banner_url}
                        alt={event?.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-emerald-300" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm flex flex-col items-center min-w-[50px]">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">
                          {format(eventDate, 'MMM', { locale: vi })}
                        </span>
                        <span className="text-lg font-black text-gray-900 leading-none">
                          {format(eventDate, 'dd')}
                        </span>
                      </div>
                    </div>
                    {isUpcoming && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center shadow-lg">
                          <Clock className="h-3 w-3 mr-1" />
                          Sắp diễn ra
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-3">
                          {event?.title}
                        </h3>

                        <div className="space-y-2.5">
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 text-emerald-600">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <span className="font-medium">
                              {format(eventDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                            </span>
                          </div>
                          {event?.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 text-red-600">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <span className="font-medium truncate">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 text-emerald-600">
                              <Users className="h-4 w-4" />
                            </div>
                            <span className="font-medium">
                              {event?._count?.registrations || 0} người đã đăng ký
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          variant={statusBadge.variant}
                          className="px-3 py-1 font-bold text-xs"
                        >
                          {statusBadge.label}
                        </Badge>

                        {isUpcoming && reg.status === 'REGISTERED' && (
                          <Link to={`/events/${event?.id}/ticket`}>
                            <Button
                              size="sm"
                              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-100"
                            >
                              <QrCode className="h-4 w-4 mr-1.5" />
                              Vé / QR
                            </Button>
                          </Link>
                        )}
                        <Link to={`/events/${event?.id}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl text-emerald-600 font-bold">
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Training Points */}
                    {event?.training_points > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-sm text-emerald-600">
                        <Award className="h-4 w-4 mr-1.5" />
                        <span className="font-medium">+{event.training_points} điểm rèn luyện</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
