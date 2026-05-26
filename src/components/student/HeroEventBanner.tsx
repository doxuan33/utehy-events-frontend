import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, MapPin, Users } from 'lucide-react'; // Thêm icon Users
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../../api/events.api';

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />
);

const LoadingSkeleton = () => (
  <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden relative shadow-lg bg-gray-100">
    <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200 to-transparent" />
    <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
      <div>
        <SkeletonBlock className="h-6 w-24 rounded-full mb-4" />
      </div>
      <div className="max-w-2xl">
        <SkeletonBlock className="h-8 w-3/4 rounded-lg mb-3" />
        <SkeletonBlock className="h-5 w-1/2 rounded-lg mb-2" />
        <SkeletonBlock className="h-5 w-2/3 rounded-lg" />
      </div>
      <div className="flex justify-end">
        <SkeletonBlock className="h-10 w-36 rounded-full" />
      </div>
    </div>
  </div>
);

const DefaultBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full h-64 md:h-80 rounded-2xl overflow-hidden relative shadow-lg"
  >
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1511795409834-ef04bbd87110?w=1200&q=80')`,
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    <div className="relative h-full flex flex-col justify-between p-6 md:p-8 text-white">
      <div>
        <span className="inline-block bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          SỰ KIỆN SẮP TỚI
        </span>
      </div>
      <div className="max-w-2xl">
        <h1 className="text-2xl md:text-4xl font-black mb-3 leading-tight">
          Hãy đón chờ những sự kiện thú vị sắp tới!
        </h1>
        <p className="text-sm md:text-base text-emerald-200">
          Các sự kiện sẽ được cập nhật tại đây. Đừng bỏ lỡ cơ hội tham gia nhé!
        </p>
      </div>
      <div className="flex justify-end">
        <Link to="/events">
          <button className="px-8 py-3 bg-white text-emerald-600 font-bold rounded-full hover:bg-emerald-50 hover:scale-105 transition-all shadow-lg">
            KHÁM PHÁ NGAY
          </button>
        </Link>
      </div>
    </div>
  </motion.div>
);

interface HeroEventBannerProps {
  event?: {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    location: string;
    banner_url?: string;
    _count?: {
      registrations?: number;
    };
  };
}

export const HeroEventBanner = ({ event }: HeroEventBannerProps) => {
  const [featuredEvent, setFeaturedEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      try {
        // Tăng limit lên 20 để lấy ra danh sách kiện, sau đó lọc ở phía client
        const response = await eventsApi.getAll({ limit: 20, status: 'APPROVED' });
        const data = response.data.data;
        const events = Array.isArray(data) ? data : data?.data || [];

        if (events.length > 0) {
          const now = new Date();

          // 1. Lọc bỏ các sự kiện đã kết thúc
          const activeEvents = events.filter((e: any) => {
            const endTime = e.end_time ? new Date(e.end_time) : null;
            const startTime = new Date(e.start_time);
            
            if (endTime) {
              return endTime > now; // Có thời gian kết thúc và chưa kết thúc
            } else {
              // Nếu không có end_time, giả định sự kiện hợp lệ nếu mới bắt đầu chưa quá 24h hoặc ở tương lai
              const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              return startTime > oneDayAgo;
            }
          });

          // 2. Sắp xếp: Ưu tiên nhiều lượt đăng ký nhất -> Sau đó ưu tiên ngày bắt đầu gần nhất
          activeEvents.sort((a: any, b: any) => {
            const aReg = a._count?.registrations || 0;
            const bReg = b._count?.registrations || 0;

            if (bReg !== aReg) {
              return bReg - aReg; // Giảm dần theo số lượng đăng ký
            }

            // Nếu số lượng đăng ký bằng nhau, ưu tiên sự kiện sắp diễn ra gần nhất
            const aTime = new Date(a.start_time).getTime();
            const bTime = new Date(b.start_time).getTime();
            return aTime - bTime;
          });

          if (activeEvents.length > 0) {
            setFeaturedEvent(activeEvents[0]); // Lấy sự kiện tốt nhất sau khi lọc
          }
        }
      } catch (error) {
        console.error('Error fetching featured event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!event) {
      fetchFeaturedEvent();
    } else {
      setFeaturedEvent(event);
      setIsLoading(false);
    }
  }, [event]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const displayEvent = event || featuredEvent;

  if (!displayEvent) {
    return <DefaultBanner />;
  }

  // Xác định trạng thái của sự kiện (Đang diễn ra hay Sắp tới)
  const now = new Date();
  const startTime = new Date(displayEvent.start_time);
  const isOngoing = startTime <= now;
  const tagLabel = isOngoing ? 'ĐANG DIỄN RA • HOT' : 'SẮP TỚI • HOT';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-64 md:h-80 rounded-2xl overflow-hidden relative shadow-lg"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${displayEvent.banner_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd87110?w=1200&q=80'})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

      <div className="relative h-full flex flex-col justify-between p-6 md:p-8 text-white">
        <div>
          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isOngoing ? 'bg-rose-500' : 'bg-emerald-500'} text-white shadow-md`}>
            {tagLabel}
          </span>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-black mb-3 leading-tight drop-shadow-md">
            {displayEvent.title}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-300" />
              <span>
                {format(startTime, 'EEEE, dd/MM/yyyy • HH:mm', { locale: vi })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-300" />
              <span className="line-clamp-1">{displayEvent.location}</span>
            </div>
            {displayEvent._count?.registrations !== undefined && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-300" />
                <span>{displayEvent._count.registrations} người tham gia</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4 md:mt-0">
          <Link to={`/events/${displayEvent.id}`}>
            <button className="px-8 py-3 bg-white text-emerald-600 font-bold rounded-full hover:bg-emerald-50 hover:scale-105 transition-all shadow-lg">
              XEM CHI TIẾT
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};