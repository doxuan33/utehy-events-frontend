import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { EventCard } from '@/components/ui/EventCard';
import { eventsApi } from '@/api/events.api';

export const AiRecommendations = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        const res = await eventsApi.getRecommended();
        const data = res.data;

        if (data?.success) {
          const events = Array.isArray(data.data) ? data.data : data.data?.events || [];
          setRecommendations(events);
        } else {
          setRecommendations([]);
        }
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch recommendations', err);
        setError('Không thể tải gợi ý AI');
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-emerald-200 animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">AI Gợi ý Sự kiện</h2>
            <p className="text-xs text-gray-500">Phù hợp nhất với bạn</p>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-4 space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Không có gợi ý nào</p>
          </div>
        ) : (
          recommendations.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EventCard event={event} showTrainingPoints={true} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AiRecommendations;