import { useEffect, useState, useCallback } from 'react';
import { postsApi } from '@/api/posts.api';
import { eventsApi } from '@/api/events.api';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { PostCard } from '@/components/student/PostCard';
import { FeedEventCard } from '@/components/student/FeedEventCard';
import { HeroEventBanner } from '@/components/student/HeroEventBanner';
import { CheckinWidget } from '@/components/student/CheckinWidget';
import { useAuthStore } from '@/store/auth.store';

export const Newsfeed = () => {
  const { user } = useAuthStore();
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [postCursor, setPostCursor] = useState<string | null>(null);
  const [eventPage, setEventPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'events'>('all');

  // HÀM 1: Fetch dữ liệu lần đầu & Load More
  const fetchFeed = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setIsFetchingMore(true);
      else {
        setIsLoading(true);
        setError(null);
      }

      const promises: any[] = [
        postsApi.getNewsfeed({
          cursor: isLoadMore ? postCursor || undefined : undefined,
          limit: 10
        })
      ];

      if (hasMoreEvents || !isLoadMore) {
        promises.push(
          eventsApi.getAll({
            page: isLoadMore ? eventPage + 1 : 1,
            limit: 10,
            status: 'APPROVED'
          })
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      const [postsRes, eventsRes] = await Promise.all(promises);

      // Xử lý Posts
      const postsData = postsRes.data.data;
      const newPosts = (postsData.data || []).map((p: any) => ({ ...p, feedType: 'post' }));
      setPostCursor(postsData.next_cursor);

      // Xử lý Events
      let newEvents: any[] = [];
      if (eventsRes) {
        const eventsData = eventsRes.data.data;
        newEvents = (eventsData.data || []).map((e: any) => ({ ...e, feedType: 'event' }));

        if (newEvents.length < 10) setHasMoreEvents(false);
        if (isLoadMore) setEventPage(prev => prev + 1);
      }

      // Merge và Sắp xếp
      const combined = [...newPosts, ...newEvents].sort((a, b) =>
        new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime()
      );

      setFeedItems(prev => isLoadMore ? [...prev, ...combined] : combined);
      
    } catch (err: any) {
      console.error('Failed to fetch feed', err);
      if (err.response?.status === 429) {
        setError('Hệ thống đang bận. Vui lòng thử lại sau ít phút.');
      } else {
        setError('Không thể tải bảng tin. Vui lòng kiểm tra lại kết nối mạng.');
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [postCursor, eventPage, hasMoreEvents]);

  // HÀM 2: CẬP NHẬT NGẦM TỰ ĐỘNG (BACKGROUND POLLING)
  const fetchLatestBackground = async () => {
    try {
      // Chỉ lấy trang 1 (10 bài mới nhất)
      const [postsRes, eventsRes] = await Promise.all([
        postsApi.getNewsfeed({ limit: 10 }),
        eventsApi.getAll({ page: 1, limit: 10, status: 'APPROVED' })
      ]);

      const newPosts = (postsRes.data?.data?.data || []).map((p: any) => ({ ...p, feedType: 'post' }));
      const newEvents = (eventsRes.data?.data?.data || []).map((e: any) => ({ ...e, feedType: 'event' }));

      const combinedNew = [...newPosts, ...newEvents].sort((a, b) =>
        new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime()
      );

      setFeedItems(prevItems => {
        // Tạo tập hợp ID của các bài đang hiển thị để kiểm tra trùng lặp nhanh
        const existingIds = new Set(prevItems.map(item => `${item.feedType}-${item.id}`));
        
        // Lọc ra NHỮNG BÀI THỰC SỰ MỚI
        const trulyNewItems = combinedNew.filter(item => !existingIds.has(`${item.feedType}-${item.id}`));

        if (trulyNewItems.length > 0) {
          // Chèn bài mới lên đầu mảng cũ
          return [...trulyNewItems, ...prevItems];
        }
        return prevItems;
      });
    } catch (error) {
      // Chạy ngầm nên nếu lỗi mạng cứ im lặng bỏ qua, đợi chu kỳ sau
      console.error("Silent background update failed", error);
    }
  };

  useEffect(() => {
    // 1. Chạy lần đầu tiên khi mở trang
    fetchFeed();

    // 2. Setup Interval tự động cập nhật ngầm mỗi 30 giây (30000ms)
    const intervalId = setInterval(() => {
      fetchLatestBackground();
    }, 30000);

    // Dọn dẹp Interval khi rời khỏi trang
    return () => clearInterval(intervalId);
  }, [fetchFeed]);

  const handleLoadMore = () => {
    if ((postCursor || hasMoreEvents) && !isFetchingMore) {
      fetchFeed(true);
    }
  };

  const filteredItems = feedItems.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'posts') return item.feedType === 'post';
    if (activeFilter === 'events') return item.feedType === 'event';
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="w-full h-64 md:h-80 rounded-2xl bg-green-50/50 animate-pulse border border-green-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-green-100 rounded-2xl p-6 h-64 animate-pulse shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[800px] mx-auto pb-20">
      
      {/* Widget Checkin Mobile */}
      <CheckinWidget className="block lg:hidden mb-4 shadow-sm border-green-100" />

      {/* Hero Banner */}
      <HeroEventBanner />

      {/* Feed Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-2">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-teal-600 tracking-tight flex items-center">
          Bảng tin <Sparkles className="h-5 w-5 ml-2 text-green-500" />
        </h2>

        {/* Filter Buttons */}
        <div className="flex bg-white rounded-xl shadow-sm border border-green-100 p-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeFilter === 'all' 
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm' 
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveFilter('events')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeFilter === 'events' 
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm' 
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            Sự kiện
          </button>
          <button
            onClick={() => setActiveFilter('posts')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeFilter === 'posts' 
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm' 
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            Bài viết
          </button>
        </div>
      </div>

      {/* Error State */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button
            onClick={() => fetchFeed()}
            className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-sm inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-24 bg-white border border-green-100 rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <Filter className="h-10 w-10 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Bảng tin trống</h3>
          <p className="text-gray-500 max-w-sm mx-auto font-medium">
            Hãy theo dõi các Câu lạc bộ để cập nhật những tin tức và sự kiện nóng hổi nhất!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={`${item.feedType}-${item.id}`}
                layout // Thuộc tính này giúp các thẻ cũ trượt mượt mà xuống dưới khi thẻ mới đẩy lên đầu
                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="transform-gpu"
              >
                {item.feedType === 'post' ? (
                  <PostCard post={item} />
                ) : (
                  <FeedEventCard event={item} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {(postCursor || hasMoreEvents) && (
            <div className="flex justify-center pt-6 pb-12">
              <button
                onClick={handleLoadMore}
                disabled={isFetchingMore}
                className="flex items-center gap-2 px-8 py-3.5 bg-white border border-green-200 rounded-full text-sm font-bold text-green-700 hover:bg-green-50 hover:border-green-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tải thêm...</span>
                  </>
                ) : (
                  <span>Tải thêm tin cũ hơn</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};