import { useEffect, useState } from 'react';
import { eventsApi } from '@/api/events.api';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { motion } from 'motion/react';
import { Search, Filter, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const EventsList = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, catsRes] = await Promise.all([
          eventsApi.getAll({ search, category_id: selectedCategory ? parseInt(selectedCategory) : undefined }),
          eventsApi.getCategories()
        ]);
        
        const eventsResponse = eventsRes.data.data;
        if (eventsResponse && typeof eventsResponse === 'object' && Array.isArray(eventsResponse.data)) {
          setEvents(eventsResponse.data);
        } else if (Array.isArray(eventsResponse)) {
          setEvents(eventsResponse);
        } else {
          setEvents([]);
        }

        const catsData = catsRes.data.data;
        setCategories(Array.isArray(catsData) ? catsData : []);
      } catch (err) {
        console.error('Failed to fetch events', err);
        setEvents([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [search, selectedCategory]);

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Khám phá sự kiện</h1>
          <p className="text-gray-500">Tìm kiếm và đăng ký tham gia các hoạt động ngoại khóa</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên sự kiện..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === '' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <motion.div
              key={event.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="relative h-48">
                <img
                  src={event.banner_url || `https://picsum.photos/seed/${event.id}/800/600`}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 right-3">
                  <Badge variant="success" className="bg-green-500 text-white border-none">
                    +{event.training_points} điểm
                  </Badge>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-3">
                  {event.title}
                </h3>
                
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2 text-red-500" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <Link to={`/events/${event.id}`}>
                  <Button variant="outline" className="w-full rounded-xl">
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
