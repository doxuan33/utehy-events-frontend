import { useState, useEffect } from 'react';
import { postsApi } from '@/api/posts.api';
import { Avatar } from '@/components/common/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentSection = ({ postId, onCommentAdded }: CommentSectionProps) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await postsApi.getComments(postId);
        setComments(res.data.data.data || []);
      } catch (err) {
        console.error('Failed to fetch comments', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await postsApi.addComment(postId, { content });
      setComments(prev => [res.data.data, ...prev]);
      setContent('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await postsApi.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  return (
    <div className="border-t border-gray-50 bg-gray-50/30 p-4 space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết bình luận..."
            className="w-full bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 group">
              <Avatar src={comment.user?.profile?.avatar_url} name={comment.user?.profile?.full_name} size="sm" />
              <div className="flex-1">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900">{comment.user?.profile?.full_name}</span>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                  
                  {comment.user_id === user?.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="absolute -right-2 -top-2 p-1.5 bg-white border border-gray-100 rounded-full text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-2">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          )}
        </div>
      )}
    </div>
  );
};
