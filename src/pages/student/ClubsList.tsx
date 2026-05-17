import { useEffect, useState, useMemo } from 'react';
import { pagesApi } from '@/api/pages.api';
import { Link } from 'react-router-dom';
import { Search, Users, ChevronRight, CheckCircle2, ChevronLeft, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ClubsList = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  // Thay đổi từ 9 thành 10 để khi hiển thị 2 cột sẽ vừa vặn, không bị lẻ
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchClubs = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await pagesApi.getAll({ search: searchQuery });
        setClubs(res.data.data);
        setCurrentPage(1); // Reset page on new search
      } catch (err: any) {
        console.error('Failed to fetch clubs', err);
        if (err.response?.status === 429) {
          setError('Hệ thống đang bận do quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.');
        } else {
          setError('Không thể tải danh sách CLB. Vui lòng thử lại sau.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchClubs, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derived state for pagination
  const totalPages = Math.max(1, Math.ceil(clubs.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const currentClubs = useMemo(() => {
    return clubs.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  }, [clubs, safeCurrentPage]);

  return (
    <div className="max-w-6xl mx-auto pb-20 p-4 md:p-8">
      
      {/* Header Section */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-teal-600 mb-3 tracking-tight">
          Khám phá Câu lạc bộ
        </h1>
        <p className="text-gray-500 font-medium text-sm md:text-base">
          Tìm kiếm và theo dõi các tổ chức sinh viên năng động nhất tại UTEHY
        </p>
      </div>

      {/* Search Bar - Glassmorphism */}
      <div className="relative mb-10 max-w-2xl group mx-auto md:mx-0">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-green-500 group-focus-within:scale-110 transition-transform" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Bạn đang tìm kiếm câu lạc bộ nào?..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-green-100 rounded-[2rem] shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium text-gray-800"
        />
      </div>

      {/* Error State */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center shadow-sm">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            Thử lại ngay
          </button>
        </div>
      ) : isLoading ? (
        // Skeleton Loading - Hiển thị 2 cột
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[120px] bg-green-50/50 border border-green-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Clubs Grid - Chuyển lg:grid-cols-3 thành lg:grid-cols-2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {currentClubs.map((club, index) => (
                <motion.div
                  layout
                  key={club.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  className="group bg-white rounded-3xl p-6 border border-green-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decorative background circle */}
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-green-50 to-teal-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <Link to={`/clubs/${club.slug}`} className="relative z-10 flex items-center space-x-5">
                    
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-green-400 blur-md opacity-20 rounded-2xl group-hover:opacity-40 transition-opacity" />
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center text-teal-700 font-black text-3xl border-2 border-white shadow-sm overflow-hidden relative z-10 group-hover:scale-105 transition-transform duration-300">
                        {club.avatar_url ? (
                          <img src={club.avatar_url} alt={club.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          club.name.charAt(0)
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-extrabold text-gray-800 text-xl truncate group-hover:text-green-600 transition-colors">
                          {club.name}
                        </h3>
                        {club.is_verified && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-50 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex items-center text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <Users className="h-4 w-4 mr-1.5 text-green-500" />
                          {club._count.followers} theo dõi
                        </div>
                        <div className="flex items-center text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <Calendar className="h-4 w-4 mr-1.5 text-teal-500" />
                          {club._count.events} sự kiện 
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 group-hover:bg-green-500 transition-colors shrink-0 shadow-sm border border-green-100 group-hover:border-transparent">
                      <ChevronRight className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {currentClubs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-green-200 shadow-sm">
              <div className="h-24 w-24 bg-gradient-to-br from-green-50 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                <Search className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy Câu lạc bộ</h3>
              <p className="text-gray-500 font-medium">Vui lòng thử tìm kiếm với từ khóa khác.</p>
            </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 pt-12">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-3 rounded-xl bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm transform hover:-translate-y-0.5"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="px-6 py-3 rounded-xl bg-white border border-green-100 shadow-sm flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-600">Trang</span>
                <span className="text-sm font-black text-green-700 bg-green-50 px-3 py-1 rounded-lg">{safeCurrentPage}</span>
                <span className="text-sm font-bold text-gray-600">/ {totalPages}</span>
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-3 rounded-xl bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm transform hover:-translate-y-0.5"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};