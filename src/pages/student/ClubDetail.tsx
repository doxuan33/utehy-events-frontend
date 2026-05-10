import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pagesApi, PageWithMembers, PageMember } from '@/api/pages.api';
import { eventsApi } from '@/api/events.api';
import { postsApi } from '@/api/posts.api';
import { registrationsApi } from '@/api/registrations.api';
import {
  Calendar,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Share2,
  Users,
  Mail,
  Phone,
  Globe,
  Facebook,
  ExternalLink,
  Loader2,
  Bell,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PostCard } from '@/components/student/PostCard';
import { EventCard } from '@/components/ui/EventCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { isPast, isFuture } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  banner_url?: string;
  max_slots: number;
  current_slots: number;
  type: string;
  training_points: number;
  is_registered?: boolean;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  image_urls?: string[];
  page: {
    id: string;
    name: string;
    slug: string;
    avatar_url?: string;
  };
  event?: Event;
}

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  is_verified: boolean;
  is_following: boolean;
  _count: {
    followers: number;
    events: number;
  };
  slogan?: string;
  category?: string;
  email?: string;
  phone?: string;
  facebook_url?: string;
  tiktok_url?: string;
  members?: PageMember[];
  created_at?: string;
  updated_at?: string;
}

const mockClubData: Club = {
  id: '1',
  name: 'Câu lạc bộ Phát triển Phần mềm',
  slug: 'phat-trien-phan-mem',
  description: 'CLB Phát triển Phần mềm - Nơi giao lưu, học hỏi và phát triển kỹ năng lập trình cho sinh viên Trường Đại học Sư phạm Kỹ thuật TP.HCM.\n\nChúng tôi tổ chức các buổi hội thảo, workshop và dự án thực tế để giúp các bạn có đầy đủ kiến thức và kinh nghiệm trong lĩnh vực công nghệ thông tin.',
  avatar_url: 'https://picsum.photos/seed/club-avatar/400/400',
  cover_url: 'https://picsum.photos/seed/club-cover/1200/400',
  category: 'Công nghệ thông tin',
  slogan: 'Code - Learn - Share - Grow',
  email: 'club.pts@hutech.edu.vn',
  phone: '0336.123.456',
  facebook_url: 'https://facebook.com/hutech.software',
  tiktok_url: 'https://tiktok.com/@hutech.software',
  is_verified: true,
  is_following: false,
  _count: {
    followers: 248,
    events: 12,
  },
  members: [],
  created_at: '',
  updated_at: '',
};

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Workshop React.js căn bản cho người mới bắt đầu',
    description: 'Học cách xây dựng ứng dụng web hiện đại với React.js',
    start_time: '2026-06-15T09:00:00',
    end_time: '2026-06-15T16:00:00',
    location: 'Phòng 201, Tòa nhà A',
    banner_url: 'https://picsum.photos/seed/event1/800/450',
    max_slots: 50,
    current_slots: 32,
    type: 'Workshop',
    training_points: 2,
  },
  {
    id: '2',
    title: 'Hackathon 24h - Đố vui lập trình',
    description: 'Cuộc thi lập trình 24 giờ cho sinh viên',
    start_time: '2026-07-01T08:00:00',
    end_time: '2026-07-02T08:00:00',
    location: 'KTX khu A',
    banner_url: 'https://picsum.photos/seed/event2/800/450',
    max_slots: 100,
    current_slots: 78,
    type: 'Competition',
    training_points: 5,
  },
  {
    id: '3',
    title: 'Seminar AI và ứng dụng trong thực tiễn',
    description: 'Tìm hiểu về Trí tuệ nhân tạo và các ứng dụng thực tế',
    start_time: '2026-04-20T14:00:00',
    end_time: '2026-04-20T17:00:00',
    location: 'Hội trường lớn',
    banner_url: 'https://picsum.photos/seed/event3/800/450',
    max_slots: 200,
    current_slots: 180,
    type: 'Seminar',
    training_points: 3,
  },
];

const mockPosts: Post[] = [
  {
    id: '1',
    content: 'Chào mừng các bạn đã đến với CLB Phát triển Phần mềm! 🎉\n\nChúng tôi vừa mở đăng ký thành viên cho năm học 2026. Các bạn có thể đăng ký tham gia từ hôm nay để được tham gia các buổi workshop và dự án thực tế nhé!',
    created_at: '2026-05-08T10:30:00',
    likes_count: 42,
    comments_count: 8,
    is_liked: true,
    image_urls: ['https://picsum.photos/seed/post1-1/800/600', 'https://picsum.photos/seed/post1-2/800/600'],
    page: {
      id: '1',
      name: 'Câu lạc bộ Phát triển Phần mềm',
      slug: 'phat-trien-phan-mem',
      avatar_url: 'https://picsum.photos/seed/club-avatar/400/400',
    },
  },
  {
    id: '2',
    content: 'Reminder: Workshop React.js sẽ diễn ra vào ngày 15/06 sắp tới. Các bạn đã đăng ký vui lòng có mặt đúng giờ nhé! ⏰\n\nĐăng ký ngay tại link: utehy.social/events/1',
    created_at: '2026-05-05T14:15:00',
    likes_count: 28,
    comments_count: 5,
    is_liked: false,
    page: {
      id: '1',
      name: 'Câu lạc bộ Phát triển Phần mềm',
      slug: 'phat-trien-phan-mem',
      avatar_url: 'https://picsum.photos/seed/club-avatar/400/400',
    },
  },
];

export const ClubDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'about'>('posts');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationModal, setRegistrationModal] = useState<{
    isOpen: boolean;
    event: Event | null;
  }>({ isOpen: false, event: null });

  useEffect(() => {
    const fetchClubData = async () => {
      if (!slug) return;
      try {
        const clubRes = await pagesApi.getBySlug(slug);
        const baseData = clubRes.data.data as PageWithMembers;
        
        const clubData: Club = {
          ...baseData,
          description: baseData.description ?? '',
          is_verified: true,
          is_following: baseData.is_following ?? false,
          _count: {
            followers: baseData._count?.followers ?? 0,
            events: baseData._count?.events ?? 0,
          },
          slogan: baseData.slogan ?? '',
          category: baseData.category ?? '',
          email: baseData.email ?? '',
          phone: baseData.phone ?? '',
          facebook_url: baseData.facebook_url ?? '',
          tiktok_url: baseData.tiktok_url ?? '',
        };
        setClub(clubData);
        setIsFollowing(clubData.is_following);

        const now = new Date();
        let eventsData: Event[] = [];
        
        try {
          const eventsRes = await eventsApi.getAll({ page_id: baseData?.id, limit: 20 });
          const rawEvents = eventsRes.data.data;
          if (rawEvents && typeof rawEvents === 'object' && Array.isArray(rawEvents.data)) {
            eventsData = rawEvents.data;
          } else if (Array.isArray(rawEvents)) {
            eventsData = rawEvents;
          }
        } catch {
          eventsData = mockEvents;
        }

        setUpcomingEvents(eventsData.filter((e: Event) => isFuture(new Date(e.start_time))));
        setPastEvents(eventsData.filter((e: Event) => isPast(new Date(e.end_time))));

        let postsData: Post[] = [];
        try {
          const postsRes = await postsApi.getNewsfeed({ page_id: baseData?.id, limit: 20 });
          const rawPosts = postsRes.data.data;
          if (rawPosts && typeof rawPosts === 'object' && Array.isArray(rawPosts.data)) {
            postsData = rawPosts.data;
          } else if (Array.isArray(rawPosts)) {
            postsData = rawPosts;
          }
        } catch {
          postsData = mockPosts;
        }
        setPosts(postsData);
      } catch (err) {
        console.error('Failed to fetch club data', err);
        setClub(mockClubData);
        setUpcomingEvents(mockEvents.filter((e: Event) => isFuture(new Date(e.start_time))));
        setPastEvents(mockEvents.filter((e: Event) => isPast(new Date(e.end_time))));
        setPosts(mockPosts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubData();
  }, [slug]);

  const handleToggleFollow = async () => {
    if (!club || isFollowLoading) return;
    try {
      setIsFollowLoading(true);
      if (isFollowing) {
        await pagesApi.unfollow(club.id);
        setIsFollowing(false);
        toast.success('Đã bỏ theo dõi CLB');
      } else {
        await pagesApi.follow(club.id);
        setIsFollowing(true);
        toast.success('Đã theo dõi CLB');
      }
    } catch (err: any) {
      const status = err?.response?.status;

      if (!isFollowing && status === 409) {
        // Backend says user already followed — sync state silently
        setIsFollowing(true);
        toast.success('Đã đồng bộ trạng thái theo dõi');
      } else if (isFollowing && (status === 404 || status === 400)) {
        // Backend says user was not following — sync state silently
        setIsFollowing(false);
        toast.success('Đã đồng bộ trạng thái theo dõi');
      } else {
        console.error('Failed to follow/unfollow club', err);
        toast.error('Thao tác thất bại, vui lòng thử lại');
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/clubs/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép liên kết CLB!');
    } catch (err) {
      toast.error('Không thể sao chép liên kết');
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    setIsRegistering(true);
    try {
      await registrationsApi.register(eventId);
      toast.success('Đăng ký tham gia sự kiện thành công!');
      setUpcomingEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, is_registered: true, current_slots: e.current_slots + 1 } : e
      ));
    } catch (err) {
      toast.error('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsRegistering(false);
      setRegistrationModal({ isOpen: false, event: null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thông tin câu lạc bộ...</p>
      </div>
    );
  }

  if (!club) return <div className="p-8 text-center">Không tìm thấy câu lạc bộ.</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
        );

      case 'events':
        return (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {upcomingEvents.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <div className="w-1 h-6 bg-emerald-500 rounded-full mr-3" />
                  Sự kiện sắp diễn ra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="space-y-3">
                      <EventCard event={event} showTrainingPoints={true} />
                      {!event.is_registered && event.current_slots < event.max_slots && (
                        <Button
                          variant="primary"
                          className="w-full bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => setRegistrationModal({ isOpen: true, event })}
                        >
                          Đăng ký tham gia
                        </Button>
                      )}
                      {event.is_registered && (
                        <div className="px-4 py-2 text-center text-sm text-emerald-600 bg-emerald-50 rounded-xl font-medium">
                          Đã đăng ký ✓
                        </div>
                      )}
                      {event.current_slots >= event.max_slots && !event.is_registered && (
                        <div className="px-4 py-2 text-center text-sm text-red-600 bg-red-50 rounded-xl font-medium">
                          Đã hết vé
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-600 flex items-center">
                  <div className="w-1 h-6 bg-gray-300 rounded-full mr-3" />
                  Sự kiện đã kết thúc
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} showTrainingPoints={true} />
                  ))}
                </div>
              </div>
            )}

            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Chưa có sự kiện nào</p>
              </div>
            )}
          </motion.div>
        );

      case 'about':
        return (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Giới thiệu CLB</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {club.description || 'Chưa có thông tin giới thiệu cho câu lạc bộ này.'}
              </p>
            </div>

            {(club.email || club.phone) && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin liên hệ</h3>
                <div className="space-y-3">
                  {club.email && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Mail className="h-5 w-5 text-emerald-500" />
                      <span>{club.email}</span>
                    </div>
                  )}
                  {club.phone && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Phone className="h-5 w-5 text-emerald-500" />
                      <span>{club.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(club.facebook_url || club.tiktok_url) && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Mạng xã hội</h3>
                <div className="flex flex-wrap gap-3">
                  {club.facebook_url && (
                    <a
                      href={club.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Facebook className="h-5 w-5" />
                      <span className="font-medium">Facebook</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {club.tiktok_url && (
                    <a
                      href={club.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <ExternalLink className="h-5 w-5" />
                      <span className="font-medium">TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mb-20"
      >
        <div className="h-48 sm:h-64 md:h-72 w-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-lg relative">
          {club.cover_url ? (
            <img src={club.cover_url} className="w-full h-full object-cover" alt="Cover" referrerPolicy="no-referrer" />
          ) : null}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute -bottom-16 left-4 sm:left-8 flex flex-col sm:flex-row sm:items-end sm:space-x-6 w-full px-4 sm:px-0">
          <div className="h-28 w-28 sm:h-36 sm:w-36 bg-white p-1.5 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-gray-100">
            <Avatar src={club.avatar_url || undefined} name={club.name} size="xl" className="h-full w-full rounded-[1.25rem] sm:rounded-[1.5rem]" />
          </div>
          <div className="flex flex-wrap  gap-2   font-medium text-gray-500">
              <span className="flex items-center"><Users className="h-3.5 w-3 sm:h-4 sm:w-4 mr-1" /> {club._count.followers} người theo dõi</span>
              <span className="flex items-center"><Calendar className="h-3.5 w-3 sm:h-4 sm:w-4 mr-1" /> {club._count.events} sự kiện</span>
            </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0 sm:pb-4">
              <Button
                variant={isFollowing ? 'secondary' : 'outline'}
                className={`rounded-2xl px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-sm flex items-center gap-2 transition-all ${
                  isFollowing
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={handleToggleFollow}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {isFollowLoading
                  ? 'Đang xử lý...'
                  : isFollowing
                  ? 'Đang theo dõi'
                  : 'Theo dõi'}
              </Button>
              <Button
                variant="primary"
                className="rounded-2xl px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-sm bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100 flex items-center gap-2"
                onClick={() => setRegistrationModal({ isOpen: true, event: null })}
              >
                <Users className="h-4 w-4" />
                Gia nhập CLB
              </Button>
            <button
              onClick={handleShare}
              className="p-2.5 sm:p-3 bg-gray-100 rounded-2xl text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 transition-all"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
        
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <div className="flex-1 mt-3 sm:mt-0 sm:pb-4 min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight truncate">{club.name}</h1>
              {club.is_verified && (
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 fill-emerald-50 flex-shrink-0" />
              )}
            </div>
            {club.slogan && (
              <p className="text-sm text-gray-500 font-medium mt-1 italic">"{club.slogan}"</p>
            )}
            {club.category && (
              <Badge variant="primary" className="mt-2 bg-emerald-100 text-emerald-700">
                {club.category}
              </Badge>
            )}

          </div>
          
          <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200 shadow-sm mb-6">
            <div className="grid grid-cols-3 gap-1">
              {[
                { key: 'posts', label: 'Bài viết', icon: FileText },
                { key: 'events', label: 'Sự kiện', icon: Calendar },
                { key: 'about', label: 'Giới thiệu', icon: Globe },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === key
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Giới thiệu</h3>
              <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
                {club.description || 'Chưa có thông tin giới thiệu cho câu lạc bộ này.'}
              </p>
              <button
                onClick={() => setActiveTab('about')}
                className="text-xs text-emerald-600 font-medium mt-2 hover:underline"
              >
                Xem thêm
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Thống kê</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Người theo dõi</span>
                  <span className="font-semibold text-gray-900">{club._count.followers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sự kiện</span>
                  <span className="font-semibold text-gray-900">{club._count.events}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={registrationModal.isOpen}
        onClose={() => setRegistrationModal({ isOpen: false, event: null })}
        onConfirm={() => registrationModal.event && handleRegisterEvent(registrationModal.event.id)}
        title="Xác nhận đăng ký"
        description={`Bạn có chắc muốn đăng ký tham gia sự kiện "${registrationModal.event?.title}"?`}
        confirmText="Đăng ký"
      />
    </div>
  );
};