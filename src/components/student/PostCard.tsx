import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, MoreHorizontal, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { postsApi } from '@/api/posts.api';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: any;
  onLikeToggle?: (postId: string, liked: boolean) => void;
}

export const PostCard = ({ post, onLikeToggle }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await postsApi.toggleLike(post.id);
      const liked = res.data.data.liked;
      setIsLiked(liked);
      setLikesCount((prev: number) => liked ? prev + 1 : prev - 1);
      if (onLikeToggle) onLikeToggle(post.id, liked);
    } catch (err) {
      console.error('Failed to toggle like', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết!');
    } catch (err) {
      toast.error('Không thể sao chép liên kết');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={`/pages/${post.page?.slug}`}>
            <Avatar src={post.page?.avatar_url} name={post.page?.name} />
          </Link>
          <div>
            <Link to={`/pages/${post.page?.slug}`} className="font-bold text-gray-900 hover:underline">
              {post.page?.name}
            </Link>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
            </p>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Event Attachment */}
      {post.event && (
        <Link to={`/events/${post.event.id}`} className="block mx-4 mb-4 group">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between group-hover:bg-blue-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm line-clamp-1">{post.event.title}</h4>
                <p className="text-xs text-blue-700">
                  {post.event.status === 'ONGOING' ? 'Đang diễn ra' : 'Sự kiện sắp diễn ra'}
                </p>
              </div>
            </div>
            <div className="flex items-center text-blue-600">
              <span className="text-xs font-bold mr-1">Chi tiết</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      )}

      {/* Post Media */}
      {post.image_urls?.length > 0 && (
        <div className={`grid gap-1 mb-2 ${post.image_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.image_urls.map((url: string, idx: number) => (
            <img 
              key={idx} 
              src={url} 
              className="w-full h-auto max-h-96 object-cover" 
              alt="Post media"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likesCount || 0}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-1.5 transition-colors ${showComments ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{commentsCount || 0}</span>
          </button>
        </div>
        <button 
          onClick={handleShare}
          className="text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Expandable Comment Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CommentSection 
              postId={post.id} 
              onCommentAdded={() => setCommentsCount((prev: number) => prev + 1)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
