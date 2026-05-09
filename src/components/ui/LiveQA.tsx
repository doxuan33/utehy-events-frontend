import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ThumbsUp, MessageCircle } from 'lucide-react';
import { useSocket, Question } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

interface LiveQAProps {
  eventId: string;
}

export const LiveQA = ({ eventId }: LiveQAProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const { joinEvent, sendQuestion, upvoteQuestion, onNewQuestion, onUpdateVote } = useSocket();

  useEffect(() => {
    joinEvent(eventId);
  }, [eventId, joinEvent]);

  useEffect(() => {
    onNewQuestion((question) => {
      setQuestions(prev => [question, ...prev]);
    });

    onUpdateVote(({ question_id, upvotes }) => {
      setQuestions(prev => prev.map(q =>
        q.id === question_id ? { ...q, upvotes } : q
      ));
    });
  }, [onNewQuestion, onUpdateVote]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      sendQuestion(eventId, newQuestion.trim());
      setNewQuestion('');
      inputRef.current?.blur();
      toast.success('Câu hỏi đã được gửi!');
    } catch {
      toast.error('Gửi câu hỏi thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = (questionId: string) => {
    upvoteQuestion(eventId, questionId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glassmorphism border border-white/30 rounded-3xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
          <MessageCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Q&A (Socket.io)</h2>
          <p className="text-xs text-gray-500">Hỏi đáp trực tiếp với nhau</p>
        </div>
        <div className="ml-auto">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Đặt câu hỏi cho sự kiện..."
            className="w-full px-4 py-3 pr-12 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
            maxLength={500}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newQuestion.trim() || isSubmitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-yellow-400 via-emerald-400 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        <AnimatePresence>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
            </div>
          ) : (
            questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.05
                }}
                className="glassmorphism border border-white/20 rounded-xl p-4 hover:bg-white/60 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{question.content}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="font-medium text-blue-600">{question.user.full_name}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(question.created_at).toLocaleTimeString('vi-VN')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpvote(question.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{question.upvotes}</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};