import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { pagesApi } from '@/api/pages.api';
import { eventsApi } from '@/api/events.api';
import { postsApi } from '@/api/posts.api';
import {
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Share2,
  MoreHorizontal,
  Plus,
  UserPlus,
  UserMinus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { PostCard } from '@/components/student/PostCard';
import { toast } from '@/components/ui/ToasterSetup';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const ClubDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'members'>('posts');

  useEffect(() => {
    const fetchClubData = async () => {
      if (!slug) return;
      try {
        const clubRes = await pagesApi.getBySlug(slug);
        const clubData = clubRes.data.data;
        setClub(clubData);
        setIsFollowing(clubData.is_following);

        // Fetch events and posts
        const [eventsRes, postsRes] = await Promise.all([
          eventsApi.getAll({ page_id: clubData.id, limit: 5 }),
          postsApi.getNewsfeed({ page_id: clubData.id, limit: 10 })
        ]);
        
        const eventsData = eventsRes.data.data;
        if (eventsData && typeof eventsData === 'object' && Array.isArray(eventsData.data)) {
          setEvents(eventsData.data);
        } else {
          setEvents(Array.isArray(eventsData) ? eventsData : []);
        }

        const postsData = postsRes.data.data;
        if (postsData && typeof postsData === 'object' && Array.isArray(postsData.data)) {
          setPosts(postsData.data);
        } else {
          setPosts(Array.isArray(postsData) ? postsData : []);
        }
      } catch (err) {
        console.error('Failed to fetch club data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubData();
  }, [slug]);

  const handleFollow = async () => {
    if (!club) return;
    try {
      if (isFollowing) {
        await pagesApi.unfollow(club.id);
        setIsFollowing(false);
      } else {
        await pagesApi.follow(club.id);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Failed to follow/unfollow club', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/clubs/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép liên kết vào clipboard!');
    } catch (err) {
      console.error('Failed to copy', err);
      toast.error('Không thể sao chép liên kết');
    }
  };

      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thông tin câu lạc bộ...</p>
      </div>

  if (!club) return <div className="p-8 text-center">Không tìm thấy câu lạc bộ.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header & Cover */}
        <div className="relative mb-24">
          <div className="h-48 md:h-64 w-full bg-emerald-500 rounded-[40px] overflow-hidden shadow-lg relative">
            {club.cover_url ? (
              <img src={club.cover_url} className="w-full h-full object-cover" alt="Cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 opacity-50" />
            )}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>

        <div className="absolute -bottom-16 left-8 flex flex-col md:flex-row md:items-end md:space-x-6 w-full px-4 md:px-0">
          <div className="h-32 w-32 md:h-40 md:w-40 bg-white p-2 rounded-[32px] shadow-xl border border-gray-100">
            <Avatar src={club.avatar_url} name={club.name} size="xl" className="h-full w-full rounded-[24px]" />
          </div>
          <div className="flex-1 mt-4 md:mt-0 md:pb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{club.name}</h1>
              {club.is_verified && (
                <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm font-medium text-gray-500">
              <span className="flex items-center"><Users className="h-4 w-4 mr-1.5" /> {club._count.followers} người theo dõi</span>
              <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" /> {club._count.events} sự kiện</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-6 md:mt-0 md:pb-4 md:pr-8">
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              className={`rounded-2xl px-8 py-3 font-bold shadow-lg ${isFollowing ? 'border-gray-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'}`}
              onClick={handleFollow}
            >
              {isFollowing ? (
                <><UserMinus className="h-5 w-5 mr-2" /> Đang theo dõi</>
              ) : (
                <><UserPlus className="h-5 w-5 mr-2" /> Theo dõi</>
              )}
            </Button>
            <button
              onClick={handleShare}
              className="p-3 bg-gray-100 rounded-2xl text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 transition-all"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Giới thiệu</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {club.description || 'Chưa có thông tin giới thiệu cho câu lạc bộ này.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Ban quản trị</h3>
            <div className="space-y-4">
              {club.members?.map((member: any) => (
                <div key={member.user.id} className="flex items-center space-x-3">
                  <Avatar src={member.user.profile.avatar_url} name={member.user.profile.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{member.user.profile.full_name}</div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {member.is_owner ? 'Chủ nhiệm' : 'Quản trị viên'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Content Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'posts' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText className="h-4 w-4" />
              <span>Bài viết</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'events' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Calendar className="h-4 w-4" />
              <span>Sự kiện</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'posts' && (
              <motion.div 
                key="posts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {posts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                    <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
                  </div>
                ) : (
                  posts.map(post => <PostCard key={post.id} post={post} />)
                )}
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div 
                key="events"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {events.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                    <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Chưa có sự kiện nào</p>
                  </div>
                ) : (
                  events.map(event => (
                    <Link 
                      key={event.id} 
                      to={`/events/${event.id}`}
                      className="block bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-all group"
                    >
                      <div className="flex space-x-4">
                         <div className="h-20 w-20 bg-emerald-50 rounded-xl overflow-hidden flex-shrink-0">
                           {event.cover_url ? (
                             <img src={event.cover_url} className="w-full h-full object-cover" alt="Cover" referrerPolicy="no-referrer" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-emerald-200">
                               <Calendar className="h-8 w-8" />
                             </div>
                           )}
                         </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">{event.title}</h4>
                          <div className="text-xs text-gray-400 font-medium mt-1">
                            {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="primary" className="bg-emerald-100 text-emerald-700 text-[10px]">{event.type}</Badge>
                            <span className="text-[10px] text-gray-400 font-bold">{event.current_slots}/{event.max_slots} SV</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
