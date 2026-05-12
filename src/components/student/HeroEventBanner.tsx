import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, MapPin } from 'lucide-react';
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
        const response = await eventsApi.getAll({ limit: 1, status: 'APPROVED' });
        const data = response.data.data;
        const events = Array.isArray(data) ? data : data?.data || [];
        if (events.length > 0) {
          setFeaturedEvent(events[0]);
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
          <span className="inline-block bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            ĐANG DIỄN RA • HOT
          </span>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-black mb-3 leading-tight">
            {displayEvent.title}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-300" />
              <span>
                {format(new Date(displayEvent.start_time), 'EEEE, dd/MM/yyyy • HH:mm', { locale: vi })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-300" />
              <span>{displayEvent.location}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
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