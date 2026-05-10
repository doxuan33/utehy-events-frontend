import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { registrationsApi } from '@/api/registrations.api';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Award,
  MapPin,
  QrCode,
  X
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format, isAfter, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

type TabMode = 'upcoming' | 'history';

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

export const MyEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabMode>('upcoming');
  const [selectedQr, setSelectedQr] = useState<string | null>(null);

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
    const eventDate = new Date(reg.event?.start_time || reg.created_at);
    return isAfter(eventDate, now) || reg.status === 'REGISTERED';
  });

  const pastEvents = registrations.filter(reg => {
    const eventDate = new Date(reg.event?.start_time || reg.created_at);
    return isBefore(eventDate, now) && reg.status !== 'REGISTERED';
  });

  const totalEvents = registrations.length;
  const totalPoints = registrations
    .filter(r => r.status === 'ATTENDED')
    .reduce((sum, r) => sum + (r.event?.training_points || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return {
          variant: 'success' as const,
          label: 'Đã duyệt',
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
          label: 'Chờ duyệt',
          className: 'bg-amber-100 text-amber-700 border border-amber-200'
        };
    }
  };

  const getQrValue = (reg: Registration) => {
    return user?.student_id || reg.id;
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
            <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-gray-100" />
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
              const points = event?.training_points || 0;

              return (
                <motion.div
                  key={reg.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Ticket Design */}
                  <div className="flex relative">
                    {/* Left Side - Event Info (70%) */}
                    <div className="flex-1 p-5 pr-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                        {event?.title}
                      </h3>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-emerald-600" />
                          <span className="font-medium">
                            {format(eventDate, 'EEEE, dd/MM/yyyy HH:mm', { locale: vi })}
                          </span>
                        </div>

                        {event?.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-red-600" />
                            <span className="font-medium truncate">{event.location}</span>
                          </div>
                        )}

                        {points > 0 && (
                          <div className="flex items-center text-sm text-emerald-600">
                            <Award className="h-4 w-4 mr-2" />
                            <span className="font-medium">+{points} điểm rèn luyện</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tear Line */}
                    <div className="absolute top-0 bottom-0 left-[70%] w-px border-l-2 border-dashed border-gray-200"></div>

                    {/* Cutout circles for tear line effect */}
                    <div className="absolute -top-3 left-[calc(70%-6px)] w-6 h-6 bg-gray-50 rounded-full"></div>
                    <div className="absolute -bottom-3 left-[calc(70%-6px)] w-6 h-6 bg-gray-50 rounded-full"></div>

                    {/* Right Side - Status & Action (30%) */}
                    <div className="w-[30%] p-5 pl-6 flex flex-col items-center justify-center space-y-3">
                      {event && (
                        <Badge
                          variant={statusBadge.variant}
                          className={`px-3 py-1 font-bold text-xs whitespace-nowrap ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </Badge>
                      )}

                      {(event && isUpcoming && reg.status === 'REGISTERED') && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedQr(getQrValue(reg))}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                        >
                          <QrCode className="h-4 w-4 mr-1.5" />
                          Xem Mã QR
                        </Button>
                      )}

                      {event && (
                        <Link to={`/events/${event.id}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl text-emerald-600 font-bold">
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
        </motion.div>
      )}

      {/* QR Modal */}
      <AnimatePresence>
        {selectedQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedQr(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedQr(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Mã QR Điểm danh</h2>

              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-2xl shadow-inner">
                  <QRCodeSVG value={selectedQr} size={256} />
                </div>
              </div>

              <p className="text-center font-bold text-amber-600 mb-6">
                Đưa mã này cho Ban tổ chức để điểm danh
              </p>

              <Button
                onClick={() => setSelectedQr(null)}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600"
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