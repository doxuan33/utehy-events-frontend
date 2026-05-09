import { useEffect, useState, useCallback } from 'react';
import { postsApi } from '@/api/posts.api';
import { eventsApi } from '@/api/events.api';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles } from 'lucide-react';
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

  const fetchFeed = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setIsFetchingMore(true);
      else {
        setIsLoading(true);
        setError(null);
      }

      const postsRes = await postsApi.getNewsfeed({
        cursor: isLoadMore ? postCursor || undefined : undefined,
        limit: 10
      });
      const postsData = postsRes.data.data;
      const newPosts = (postsData.data || []).map((p: any) => ({ ...p, feedType: 'post' }));

      let newEvents: any[] = [];
      if (hasMoreEvents) {
        const eventsRes = await eventsApi.getAll({
          page: isLoadMore ? eventPage + 1 : 1,
          limit: 10,
          status: 'APPROVED'
        });
        const eventsData = eventsRes.data.data;
        newEvents = (eventsData.data || []).map((e: any) => ({ ...e, feedType: 'event' }));

        if (newEvents.length < 10) setHasMoreEvents(false);
        if (isLoadMore) setEventPage(prev => prev + 1);
      }

      const combined = [...newPosts, ...newEvents].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFeedItems(prev => isLoadMore ? [...prev, ...combined] : combined);
      setPostCursor(postsData.next_cursor);
    } catch (err: any) {
      console.error('Failed to fetch feed', err);
      if (err.response?.status === 429) {
        setError('Hệ thống đang bận. Vui lòng thử lại sau ít phút.');
      } else {
        setError('Không thể tải bảng tin. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [postCursor, eventPage, hasMoreEvents]);

  useEffect(() => {
    fetchFeed();
  }, []);

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
        <div className="w-full h-64 md:h-80 rounded-2xl bg-gray-200 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 h-64 animate-pulse shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CheckinWidget className="block lg:hidden mb-4" />

      <HeroEventBanner />

      <h2 className="text-lg font-bold text-gray-900">Bảng tin cộng đồng</h2>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => fetchFeed()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-xl shadow-sm">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Bảng tin trống</h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            Hãy theo dõi các Câu lạc bộ để cập nhật những tin tức và sự kiện mới nhất!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={`${item.feedType}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
            <div className="flex justify-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={isFetchingMore}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tải...</span>
                  </>
                ) : (
                  <span>Xem thêm bài viết</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};