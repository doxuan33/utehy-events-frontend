import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { eventsApi } from '@/api/events.api';
import { registrationsApi } from '@/api/registrations.api';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { LiveQA } from '@/components/ui/LiveQA';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Info, QrCode, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [regCount, setRegCount] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventsApi.getById(id!);
        const eventData = res.data.data;
        setEvent(eventData);
        setIsRegistered(eventData.is_registered || false);
        setRegCount(eventData._count?.registrations || 0);
      } catch (err) {
        console.error('Failed to fetch event', err);
        toast.error('Không thể tải thông tin sự kiện');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegisterToggle = async () => {
    if (isRegistering) return;

    // Capacity check for registration
    if (!isRegistered && regCount >= (event?.max_slots || Infinity)) {
      toast.error('Rất tiếc, sự kiện này đã hết chỗ trống.');
      return;
    }

    if (isRegistered) {
      // Cancel registration flow requires confirmation
      setShowConfirmDialog(true);
      return;
    }

    // Optimistic UI for registration
    setIsRegistering(true);
    setRegCount(prev => prev + 1);
    setIsRegistered(true);

    try {
      await registrationsApi.register(id!);
      toast.success('Đăng ký tham gia thành công! Đã thêm vào lịch trình của bạn.');

      // Refresh event to ensure consistency
      const res = await eventsApi.getById(id!);
      setEvent(res.data.data);
      setRegCount(res.data.data._count?.registrations || regCount + 1);
    } catch (err: any) {
      // Revert optimistic update on error
      setRegCount(prev => prev - 1);
      setIsRegistered(false);

      const message = err.response?.data?.message || 'Thao tác thất bại.';
      if (message.toLowerCase().includes('overlap')) {
        toast.error('Lỗi: Bạn đã có một sự kiện khác diễn ra vào thời gian này.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleConfirmCancel = async () => {
    setShowConfirmDialog(false);
    setIsRegistering(true);

    // Optimistic UI for cancellation
    setRegCount(prev => prev - 1);
    setIsRegistered(false);

    try {
      await registrationsApi.cancel(id!);
      toast.success('Đã hủy đăng ký tham gia sự kiện.');

      // Refresh event to ensure consistency
      const res = await eventsApi.getById(id!);
      setEvent(res.data.data);
      setRegCount(res.data.data._count?.registrations || regCount - 1);
    } catch (err: any) {
      // Revert optimistic update on error
      setRegCount(prev => prev + 1);
      setIsRegistered(true);
      toast.error(err.response?.data?.message || 'Hủy đăng ký thất bại.');
    } finally {
      setIsRegistering(false);
    }
  };

   if (isLoading) return (
     <div className="p-8 text-center">
       <div className="bg-white border border-gray-100 rounded-xl p-12 max-w-md mx-auto shadow-sm">
         <div className="animate-pulse">
           <div className="h-8 bg-gray-200 rounded-lg mb-4"></div>
           <div className="h-4 bg-gray-200 rounded-lg mb-2"></div>
           <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
         </div>
       </div>
     </div>
   );
   if (!event) return <div className="p-8 text-center bg-white border border-gray-100 rounded-xl shadow-sm">Không tìm thấy sự kiện.</div>;

  const maxSlots = event.max_slots || Infinity;
  const availableSlots = maxSlots - regCount;
  const displayRegCount = event._count?.registrations !== undefined ? regCount : event._count?.registrations;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-600 hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Quay lại
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden"
      >
        <img
          src={event.banner_url || `https://picsum.photos/seed/${event.id}/1600/600`}
          className="w-full h-64 md:h-80 object-cover rounded-2xl"
          alt={event.title}
          referrerPolicy="no-referrer"
        />

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <div className="flex-1 lg:flex-[70%] space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {event.title}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl">
                    <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                    <span className="text-sm font-medium">
                      {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl">
                    <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
                    <span className="text-sm font-medium">{event.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl">
                    <Users className="h-4 w-4 mr-2 text-emerald-500" />
                    <span className="text-sm font-medium">
                      {displayRegCount || regCount}/{maxSlots === Infinity ? '∞' : maxSlots} người đăng ký
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center p-6 bg-emerald-500 text-white rounded-xl shadow-sm">
                <span className="text-xs font-bold uppercase mb-1 opacity-90">Điểm rèn luyện</span>
                <span className="text-4xl font-bold">+{event.training_points}</span>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-emerald-600" />
                Mô tả sự kiện
              </h2>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed">
                  {event.description || 'Chưa có mô tả chi tiết cho sự kiện này.'}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-emerald-600" />
                Live Q&A (Socket.io)
              </h2>
              <LiveQA eventId={event.id} />
            </section>

            <section>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Đơn vị tổ chức</h3>
                <div className="flex items-center gap-4">
                  <Avatar src={event.page?.logo_url} name={event.page?.name} size="lg" />
                  <div>
                    <h4 className="font-bold text-gray-900">{event.page?.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{event.page?.description}</p>
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-emerald-600">
                      Xem trang CLB
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:flex-[30%]">
            <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Đăng ký tham gia</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Trạng thái</span>
                  <Badge variant="success">Đang mở</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hạn đăng ký</span>
                  <span className="font-medium">
                    {format(new Date(event.registration_deadline), 'dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>

                {isRegistered && event.status === 'ONGOING' && (
                  <Link to="/checkin" className="block w-full">
                    <Button className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-sm mb-4">
                      <QrCode className="h-5 w-5 mr-2" />
                      Điểm danh ngay
                    </Button>
                  </Link>
                )}

                <Button
                  className={`w-full py-4 text-lg rounded-xl shadow-sm font-semibold transition-all ${
                    isRegistered
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:from-emerald-600 hover:to-emerald-500'
                  }`}
                  onClick={handleRegisterToggle}
                  isLoading={isRegistering}
                >
                  {isRegistered ? 'HỦY ĐĂNG KÝ' : 'ĐĂNG KÝ NGAY'}
                </Button>

                <Button variant="outline" className="w-full rounded-xl">
                  <Share2 className="h-4 w-4 mr-2" />
                  Chia sẻ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Xác nhận hủy đăng ký"
        description="Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không? Sau khi hủy, bạn sẽ mất điểm rèn luyện từ sự kiện này."
        confirmText="Hủy đăng ký"
      />
    </div>
  );
};
