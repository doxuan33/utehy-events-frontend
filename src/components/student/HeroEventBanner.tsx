import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

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
  const defaultEvent = {
    id: '1',
    title: 'Hội Thảo Kỹ Năng Mềm - Chuẩn Đầu Ra QH8.0',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Hội trường A - Tầng 2, Tòa nhà A',
    banner_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd87110?w=1200&q=80',
  };

  const displayEvent = event || defaultEvent;

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
              ĐĂNG KÝ NGAY
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};