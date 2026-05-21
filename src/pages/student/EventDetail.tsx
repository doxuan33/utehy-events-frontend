import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { eventsApi } from '@/api/events.api';
import { registrationsApi } from '@/api/registrations.api';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { LiveQA } from '@/components/ui/LiveQA';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { motion } from 'framer-motion'; 
import { 
  Calendar, MapPin, Users, Clock, ArrowLeft, Share2, 
  Info, QrCode, MessageCircle, Award, Sparkles, Building2
} from 'lucide-react';
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

    if (!isRegistered && regCount >= (event?.max_slots || Infinity)) {
      toast.error('Rất tiếc, sự kiện này đã hết chỗ trống.');
      return;
    }

    if (isRegistered) {
      setShowConfirmDialog(true);
      return;
    }

    setIsRegistering(true);
    setRegCount(prev => prev + 1);
    setIsRegistered(true);

    try {
      await registrationsApi.register(id!);
      toast.success('Đăng ký tham gia thành công!');
      const res = await eventsApi.getById(id!);
      setEvent(res.data.data);
      setRegCount(res.data.data._count?.registrations || regCount + 1);
    } catch (err: any) {
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
    setRegCount(prev => prev - 1);
    setIsRegistered(false);

    try {
      await registrationsApi.cancel(id!);
      toast.success('Đã hủy đăng ký.');
      const res = await eventsApi.getById(id!);
      setEvent(res.data.data);
      setRegCount(res.data.data._count?.registrations || regCount - 1);
    } catch (err: any) {
      setRegCount(prev => prev + 1);
      setIsRegistered(true);
      toast.error(err.response?.data?.message || 'Hủy đăng ký thất bại.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-8 flex justify-center items-start pt-20">
      <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-3xl p-12 w-full max-w-md shadow-xl shadow-emerald-900/5">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-emerald-100/50 rounded-2xl mb-6"></div>
          <div className="h-8 bg-emerald-100/50 rounded-lg w-3/4"></div>
          <div className="h-4 bg-emerald-100/50 rounded-lg w-1/2"></div>
        </div>
      </div>
    </div>
  );

  if (!event) return <div className="p-8 text-center text-gray-500 font-medium mt-10">Không tìm thấy sự kiện.</div>;

  const maxSlots = event.max_slots || Infinity;
  const displayRegCount = event._count?.registrations !== undefined ? regCount : event._count?.registrations;

  return (
    <div className="min-h-screen from-emerald-50/80 via-white to-white pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6 md:pt-8">
        
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-emerald-600 font-medium transition-all bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-100 shadow-sm hover:shadow-md w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full h-[250px] md:h-[350px] rounded-[2rem] overflow-hidden shadow-lg shadow-emerald-900/10 group">
            <img
              src={event.banner_url || `https://picsum.photos/seed/${event.id}/1600/600`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt={event.title}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>
          <h1 className="mt-8 px-2 text-2xl md:text-[28px] font-bold text-gray-800 leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-6 md:mt-8">
            
            <div className="flex-1 min-w-0 space-y-10">
              
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-none px-3 py-1 rounded-full font-semibold">
                    Sự kiện
                  </Badge>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md shadow-emerald-500/20">
                    <Award className="h-4 w-4" />
                    +{event.training_points} Điểm rèn luyện
                  </div>
                </div>
                

                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex items-start text-gray-700">
                    <Clock className="h-5 w-5 mr-3 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Thời gian: </span>
                      {format(new Date(event.start_time), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                    </div>
                  </div>
                  
                  <div className="flex items-start text-gray-700">
                    <MapPin className="h-5 w-5 mr-3 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Địa điểm: </span>
                      {event.location}
                    </div>
                  </div>

                  <div className="flex items-start text-gray-700">
                    <Users className="h-5 w-5 mr-3 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Số lượng đăng ký: </span>
                      <span className="text-emerald-600 font-bold">{displayRegCount || regCount}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      {maxSlots === Infinity ? 'Không giới hạn' : maxSlots}
                    </div>
                  </div>
                </div>
              </div>

              <section className="bg-white rounded-[2rem] p-6 md:p-8 border border-emerald-100/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                    <Info className="h-4 w-4" />
                  </div>
                  Giới thiệu sự kiện
                </h2>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  {event.description ? (
                    <p className="whitespace-pre-wrap">{event.description}</p>
                  ) : (
                    <p className="italic text-gray-400">Chưa có mô tả chi tiết.</p>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-[2rem] p-6 md:p-8 border border-emerald-100/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  Thảo luận & Hỏi đáp (Live)
                </h2>
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                   <LiveQA eventId={event.id} />
                </div>
              </section>

              <section className="bg-white rounded-[2rem] p-6 md:p-8 border border-emerald-100/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                    <Building2 className="h-4 w-4" />
                  </div>
                  Đơn vị tổ chức
                </h2>
                <div className="flex items-center gap-5 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
                  <div className="p-1 bg-white rounded-full shadow-sm">
                    <Avatar src={event.page?.logo_url} name={event.page?.name} size="lg" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{event.page?.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{event.page?.description}</p>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50 rounded-full font-semibold">
                      Xem trang
                    </Button>
                  </div>
                </div>
              </section>
            </div>

            {/* CỘT PHẢI (SIDEBAR) - Cố định độ rộng w-[360px] đến w-[380px] */}
            <div className="w-full lg:w-[300px] xl:w-[320px] shrink-0">
              <div className="bg-white/70 backdrop-blur-xl border border-emerald-100/80 rounded-[2rem] p-7 shadow-[0_8px_30px_rgb(16,185,129,0.06)] sticky top-24">
                
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900">Đăng ký</h3>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 animate-pulse">
                    Đang mở
                  </Badge>
                </div>
                
                {/* THIẾT KẾ LẠI BÊN TRONG: Các khối hộp riêng biệt giúp chống bóp chữ */}
                <div className="space-y-2 mb-8">
                  <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Hạn đăng ký</span>
                    </div>
                    <span className="font-bold text-gray-900 whitespace-nowrap">
                      {format(new Date(event.registration_deadline), 'dd/MM/yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Điểm thưởng</span>
                    </div>
                    <span className="font-bold text-emerald-600 whitespace-nowrap">
                      +{event.training_points} điểm
                    </span>
                  </div>
                </div>

                {isRegistered && event.status === 'ONGOING' && (
                  <Link to="/scan-qr" className="block w-full mb-4">
                    <Button className="w-full py-5 rounded-2xl bg-gray-900 hover:bg-black text-white shadow-lg transition-transform hover:scale-[1.02]">
                      <QrCode className="h-5 w-5 mr-2" />
                      Điểm danh QR
                    </Button>
                  </Link>
                )}

                <Button
                  className={`w-full py-5 text-base rounded-2xl shadow-lg font-bold transition-all duration-300 hover:scale-[1.02] ${
                    isRegistered
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-red-500/10'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:from-emerald-600 hover:to-teal-500 shadow-emerald-500/25'
                  }`}
                  onClick={handleRegisterToggle}
                  isLoading={isRegistering}
                >
                  {isRegistered ? 'HỦY ĐĂNG KÝ' : 'ĐĂNG KÝ NGAY'}
                </Button>

                <div className="mt-5 pt-5 border-t border-gray-100">
                  <Button variant="ghost" className="w-full rounded-2xl text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ sự kiện
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
          title="Xác nhận hủy"
          description="Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không? Bạn sẽ không nhận được điểm rèn luyện."
          confirmText="Xác nhận hủy"
        />
      </div>
    </div>
  );
};