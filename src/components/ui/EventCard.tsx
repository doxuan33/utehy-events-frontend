import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, MapPin, Users, ChevronRight, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface EventCardProps {
  event: any;
  showTrainingPoints?: boolean;
}

export const EventCard = ({ event, showTrainingPoints = true }: EventCardProps) => {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Training Points Badge */}
      {showTrainingPoints && event.training_points > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
            +{event.training_points} điểm RL
          </div>
        </div>
      )}

      {/* Event Cover Image */}
      <Link to={`/events/${event.id}`} className="block relative aspect-video overflow-hidden">
        <img
          src={event.banner_url || `https://picsum.photos/seed/${event.id}/800/450`}
          className="w-full h-full object-cover"
          alt={event.title}
          referrerPolicy="no-referrer"
        />
      </Link>

      {/* Event Info */}
      <div className="p-5">
        <Link to={`/events/${event.id}`} className="block group mb-3">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
            {event.title}
          </h3>
        </Link>

        <div className="space-y-3 mb-5">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
            <span className="text-sm">
              {format(new Date(event.start_time), 'dd/MM/yyyy • HH:mm', { locale: vi })}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
            <span className="text-sm truncate">{event.location}</span>
          </div>

          {event._count?.registrations !== undefined && (
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2 text-emerald-500" />
              <span className="text-sm">
                {event._count?.registrations || 0} người đã đăng ký
              </span>
            </div>
          )}
        </div>

        {/* Register Button */}
        <div className="flex gap-2">
          <Link to={`/events/${event.id}`} className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>Đăng ký ngay</span>
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </Link>
          <button
            onClick={handleShare}
            className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;