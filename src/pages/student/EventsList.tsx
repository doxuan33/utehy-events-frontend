import { useEffect, useState, useMemo } from 'react';
import { eventsApi } from '@/api/events.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Clock, ChevronLeft, ChevronRight, CheckCircle2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const EventsList = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Đổi thành 8 để hợp với Grid 2 cột

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
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
        
        setCurrentPage(1); // Reset page on filter/search change

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
    
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(events.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const currentEvents = useMemo(() => {
    return events.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  }, [events, safeCurrentPage]);

  return (
    // [FIX LAYOUT]: Đổi từ max-w-7xl thành max-w-[850px] để thu nhỏ vùng Center lại (60% màn hình)
    <div className="space-y-6 pb-20 md:pb-0 w-full max-w-[800px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-teal-600 tracking-tight mb-2">
            Khám phá sự kiện
          </h1>
          <p className="text-gray-500 font-medium text-sm">Tìm kiếm và tham gia các hoạt động ngoại khóa hấp dẫn</p>
        </div>
        
        <div className="w-full md:w-64 relative group flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-green-500 group-focus-within:scale-110 transition-transform" />
          </div>
          <input
            type="text"
            placeholder="Tìm tên sự kiện..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-green-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium text-gray-700 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCategory === '' 
              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm' 
              : 'bg-white text-gray-600 border border-green-100 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategory === cat.id 
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm' 
                : 'bg-white text-gray-600 border border-green-100 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
            }`}
          >
            {cat.name} 
            {cat._count?.events !== undefined && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {cat._count.events}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        // [FIX LAYOUT]: Giảm từ 3 cột xuống 2 cột cho khung Center hẹp
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-green-50/50 rounded-2xl h-[320px] animate-pulse border border-green-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {currentEvents.map((event, index) => (
                <motion.div
                  layout
                  key={event.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-green-100 hover:border-green-200 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] overflow-hidden flex flex-col group transition-all duration-300"
                >
                  {/* Event Cover Image */}
                  <div className="relative h-44 overflow-hidden bg-gray-50">
                    {event.banner_url ? (
                      <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-green-200 bg-gradient-to-br from-green-50 to-white">
                        <Calendar size={40} className="mb-2 opacity-50" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-white/95 backdrop-blur-sm text-green-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">
                        {event.category?.name || 'Sự kiện'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                      <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-2.5 py-1 rounded-md text-xs font-black shadow-sm flex items-center gap-1.5">
                        <CheckCircle2 size={12} />
                        +{event.training_points} điểm
                      </span>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-extrabold text-lg text-gray-800 line-clamp-2 mb-3 group-hover:text-green-600 transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2.5 mb-5 flex-1">
                      <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50/80 p-2 rounded-lg border border-transparent group-hover:border-green-100 transition-colors">
                        <div className="p-1.5 bg-green-50 rounded-md text-green-600 mr-2.5 shadow-sm"><Clock className="h-3.5 w-3.5" /></div>
                        {format(new Date(event.start_time), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      </div>
                      <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50/80 p-2 rounded-lg border border-transparent group-hover:border-green-100 transition-colors">
                        <div className="p-1.5 bg-teal-50 rounded-md text-teal-600 mr-2.5 shadow-sm"><MapPin className="h-3.5 w-3.5" /></div>
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    <Link to={`/events/${event.id}`}>
                      <Button className="w-full rounded-xl py-2.5 font-bold text-sm bg-green-50 text-green-700 hover:bg-gradient-to-r hover:from-green-500 hover:to-teal-500 hover:text-white transition-all duration-300 shadow-none hover:shadow-sm border-none">
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {currentEvents.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-green-200 shadow-sm">
              <div className="h-20 w-20 bg-gradient-to-br from-green-50 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <Search className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Không tìm thấy sự kiện nào</h3>
              <p className="text-sm text-gray-500 font-medium">Vui lòng thử tìm kiếm với từ khóa khác.</p>
            </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3 pt-8">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-lg bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="px-4 py-2 rounded-lg bg-white border border-green-100 shadow-sm flex items-center space-x-1.5">
                <span className="text-xs font-bold text-gray-600">Trang</span>
                <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-0.5 rounded">{safeCurrentPage}</span>
                <span className="text-xs font-bold text-gray-600">/ {totalPages}</span>
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};