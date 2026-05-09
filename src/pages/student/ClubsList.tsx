import { useEffect, useState } from 'react';
import { pagesApi } from '@/api/pages.api';
import { Link } from 'react-router-dom';
import { Search, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Avatar } from '@/components/common/Avatar';

export const ClubsList = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      setError(null);
      try {
        const res = await pagesApi.getAll({ search: searchQuery });
        setClubs(res.data.data);
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

    const timer = setTimeout(fetchClubs, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Khám phá CLB</h1>
        <p className="text-gray-500 font-medium">Tìm kiếm và theo dõi các câu lạc bộ, tổ chức sinh viên tại UTEHY</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm tên câu lạc bộ..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <Link to={`/clubs/${club.slug}`} className="flex items-center space-x-4">
                <Avatar src={club.avatar_url} name={club.name} size="lg" className="rounded-2xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                   <h3 className="font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                     {club.name}
                   </h3>
                     {club.is_verified && (
                       <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                     )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 font-medium mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {club._count.followers} người theo dõi
                  </div>
                  <div className="text-xs text-gray-400 font-medium mt-0.5">
                    {club._count.events} sự kiện đã tổ chức
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && clubs.length === 0 && (
        <div className="text-center py-20">
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-10 w-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Không tìm thấy câu lạc bộ nào phù hợp</p>
        </div>
      )}
    </div>
  );
};
