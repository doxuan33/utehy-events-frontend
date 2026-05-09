import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import { registrationsApi } from '@/api/registrations.api';
import { usersApi } from '@/api/users.api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Settings,
  Award,
  History,
  ShieldCheck,
  ChevronRight,
  Star,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Edit3,
  Save,
  X,
  Upload,
  User,
  BookOpen,
  Home,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    faculty: user?.faculty || '',
    class_name: user?.class_name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await registrationsApi.getMyRegistrations({ limit: 5 });
        const data = res.data.data;
        setRegistrations(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    setFormData({
      full_name: user?.full_name || '',
      faculty: user?.faculty || '',
      class_name: user?.class_name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
    });
  }, [user, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedFile) {
        const avatarRes = await usersApi.uploadAvatar(selectedFile);
        updateUser({ avatar_url: avatarRes.data.data.avatar_url });
      }

      const updateRes = await usersApi.updateMe(formData);
      const updatedUser = updateRes.data.data;
      updateUser(updatedUser);

      setIsEditMode(false);
      setSelectedFile(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setAvatarPreview(null);
    setSelectedFile(null);
    setFormData({
      full_name: user?.full_name || '',
      faculty: user?.faculty || '',
      class_name: user?.class_name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
    });
  };

  const stats = [
    { label: 'Sự kiện', value: registrations.length.toString(), icon: History, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Điểm RL', value: user?.training_points?.toString() || '0', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Huy hiệu', value: '4', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  const badges = [
    { name: 'Tân binh', description: 'Tham gia sự kiện đầu tiên', icon: Star, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { name: 'Năng nổ', description: 'Tham gia 5 sự kiện', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { name: 'Chuyên gia', description: 'Đạt 50 điểm rèn luyện', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { name: 'Tình nguyện viên', description: 'Tham gia sự kiện tình nguyện', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  const displayAvatar = avatarPreview || user?.avatar_url;

  return (
    <AnimatePresence mode="wait">
      {isEditMode ? (
        <motion.div
          key="edit"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <Edit3 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Chỉnh sửa hồ sơ</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Cập nhật thông tin cá nhân của bạn</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Avatar & Quick Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Ảnh đại diện</h3>
                <div className="flex flex-col items-center">
                  <div className="relative group">
                <Avatar
                  src={displayAvatar}
                  name={user?.full_name}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                />
                    <button
                      onClick={handleAvatarClick}
                      className="absolute -bottom-2 -right-2 p-2.5 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all group-hover:scale-105"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">Nhấn vào biểu tượng máy ảnh để thay đổi ảnh đại diện</p>
                  {selectedFile && (
                    <p className="text-xs text-emerald-600 font-medium mt-2">{selectedFile.name}</p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-white rounded-xl">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Điểm rèn luyện</p>
                    <p className="text-2xl font-black text-gray-900">{user?.training_points || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-xl">
                    <History className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Sự kiện đã tham gia</p>
                    <p className="text-2xl font-black text-gray-900">{registrations.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Họ và tên"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Nhập họ tên đầy đủ"
                    className="rounded-xl"
                  />
                  <Input
                    label="Mã sinh viên"
                    value={user?.student_id || ''}
                    disabled
                    className="bg-gray-50 rounded-xl cursor-not-allowed"
                  />
                  <Input
                    label="Khoa"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Công nghệ thông tin"
                    className="rounded-xl"
                  />
                  <Input
                    label="Lớp"
                    name="class_name"
                    value={formData.class_name}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: D22CQAT01"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Biography */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900">Tiểu sử</h3>
                </div>
                <div className="w-full space-y-1.5">
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Giới thiệu về bản thân, sở thích, mục tiêu..."
                    className="flex w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right">{formData.bio?.length || 0}/500</p>
                </div>
              </div>

              {/* Email & Contact */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900">Thông tin liên hệ</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
                  </div>
                  <Input
                    label="Số điện thoại"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Lưu ý:</span> Thông tin sẽ được cập nhật ngay lập tức vào hệ thống.
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="rounded-xl px-6">
                  <X className="h-4 w-4 mr-2" />
                  Hủy bỏ
                </Button>
                <Button onClick={handleSave} isLoading={isSaving} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-8 shadow-lg shadow-emerald-100">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-4xl mx-auto space-y-8 pb-20"
        >
          {/* Profile Header */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                <Avatar
                  src={user?.avatar_url}
                  name={user?.full_name}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                />
                <div className="flex space-x-3">
                  <Link to="/settings">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Settings className="h-4 w-4 mr-2" />
                      Cài đặt
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
            <p className="text-gray-500 flex items-center mt-1">
              <ShieldCheck className="h-4 w-4 mr-1 text-emerald-500" />
              Sinh viên • MSSV: {user?.student_id || 'Chưa cập nhật'}
            </p>
                {user?.class_name && (
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Lớp: {user.class_name}
                  </p>
                )}
                {user?.faculty && (
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <Home className="h-4 w-4 mr-1" />
                    Khoa: {user.faculty}
                  </p>
                )}
                {user?.bio && (
                  <p className="text-sm text-gray-600 mt-2 italic line-clamp-2">{user.bio}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                      <div className={`mx-auto h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-2`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Achievements */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Bộ sưu tập Huy hiệu</h2>
                <button className="text-sm font-medium text-emerald-600 hover:underline">Xem tất cả</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.name} className="flex items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 space-x-3">
                      <div className={`h-12 w-12 ${badge.bg} rounded-full flex items-center justify-center border-2 ${badge.border}`}>
                        <Icon className={`h-6 w-6 ${badge.color}`} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{badge.name}</h4>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent Activities */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Lịch sử tham gia</h2>
              <Link to="/my-events" className="text-sm font-medium text-emerald-600 hover:underline">Xem tất cả</Link>
            </div>
              <div className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">Bạn chưa tham gia sự kiện nào.</p>
                  </div>
                ) : (
                  registrations.map((reg) => (
                    <Link
                      key={reg.id}
                      to={`/events/${reg.event_id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          reg.status === 'ATTENDED' ? 'bg-emerald-50 text-emerald-600' :
                          reg.status === 'ABSENT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {reg.status === 'ATTENDED' ? <CheckCircle2 className="h-5 w-5" /> :
                           reg.status === 'ABSENT' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{reg.event?.title}</h4>
                          <p className="text-xs text-gray-500">
                            {reg.status === 'ATTENDED' ? 'Đã tham gia' :
                             reg.status === 'ABSENT' ? 'Vắng mặt' : 'Đã đăng ký'} • {reg.created_at ? format(new Date(reg.created_at), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* About Section */}
          {user?.bio && (
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-emerald-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">Giới thiệu</h2>
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
            </section>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
