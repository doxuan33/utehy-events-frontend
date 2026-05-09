import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, MapPin, Users, ChevronRight, Share2, MoreHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';

interface FeedEventCardProps {
  event: any;
}

export const FeedEventCard = ({ event }: FeedEventCardProps) => {
  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết!');
    } catch (err) {
      toast.error('Không thể sao chép liên kết');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={`/pages/${event.page?.slug}`}>
            <Avatar src={event.page?.avatar_url} name={event.page?.name} />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link to={`/pages/${event.page?.slug}`} className="font-bold text-gray-900 hover:underline">
                {event.page?.name}
              </Link>
              <Badge variant="primary" className="text-[10px] py-0 px-1.5 h-4">Sự kiện</Badge>
            </div>
            <p className="text-xs text-gray-500">
              Đã đăng {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: vi })}
            </p>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <Link to={`/events/${event.id}`} className="block relative aspect-video overflow-hidden">
        <img
          src={event.banner_url || `https://picsum.photos/seed/${event.id}/800/450`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          alt={event.title}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm flex flex-col items-center min-w-[50px]">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">{format(new Date(event.start_time), 'MMM', { locale: vi })}</span>
            <span className="text-xl font-black text-gray-900 leading-none">{format(new Date(event.start_time), 'dd')}</span>
          </div>
        </div>
        {event.is_recommended && (
          <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 px-3 py-1 rounded-full text-[10px] font-black flex items-center shadow-lg">
            <Sparkles className="h-3 w-3 mr-1 fill-current" />
            GỢI Ý CHO BẠN
          </div>
        )}
      </Link>

      <div className="p-5">
        <Link to={`/events/${event.id}`} className="block group">
          <h3 className="text-xl font-black text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-3">
            {event.title}
          </h3>
        </Link>

        <div className="space-y-2.5 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 text-emerald-600">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="font-medium">{format(new Date(event.start_time), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 text-red-600">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="font-medium truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mr-3 text-green-600">
              <Users className="h-4 w-4" />
            </div>
            <span className="font-medium">{event._count?.registrations || 0} người đã đăng ký</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <Link to={`/events/${event.id}`} className="flex-1">
            <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center">
              Xem chi tiết & Đăng ký
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </Link>
          <button
            onClick={handleShare}
            className="ml-3 p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};