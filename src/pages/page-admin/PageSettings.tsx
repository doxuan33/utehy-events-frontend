import { useState, useEffect } from 'react';
import { pagesApi } from '@/api/pages.api';
import { Button } from '@/components/common/Button';
import { motion } from 'motion/react';
import { 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Type,
  FileText,
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const PageSettings = () => {
  const { user } = useAuthStore();
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    avatar_url: '',
    cover_url: '',
  });

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      // For now, we assume the user is an admin of a page and we fetch the first one they manage
      const res = await pagesApi.getAll();
      const managedPage = res.data.data?.[0]; // Simplified for demo
      if (managedPage) {
        setPage(managedPage);
        setFormData({
          name: managedPage.name || '',
          description: managedPage.description || '',
          slug: managedPage.slug || '',
          avatar_url: managedPage.avatar_url || '',
          cover_url: managedPage.cover_url || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch page data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !page) return;

    setIsUploadingAvatar(true);
    setMessage(null);
    try {
      const res = await pagesApi.uploadAvatar(page.id, file);
      const newAvatarUrl = res.data.data.avatar_url;
      setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      setMessage({ type: 'success', text: 'Cập nhật Logo thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Tải ảnh lên thất bại.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !page) return;

    setIsUploadingCover(true);
    setMessage(null);
    try {
      const res = await pagesApi.uploadCover(page.id, file);
      const newCoverUrl = res.data.data.cover_url;
      setFormData(prev => ({ ...prev, cover_url: newCoverUrl }));
      setMessage({ type: 'success', text: 'Cập nhật Ảnh bìa thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Tải ảnh lên thất bại.' });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;

    setIsSaving(true);
    setMessage(null);
    try {
      await pagesApi.update(page.id, {
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
      });
      setMessage({ type: 'success', text: 'Cập nhật thông tin Fanpage thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Cập nhật thất bại.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Không tìm thấy Fanpage</h3>
        <p className="text-gray-500">Bạn chưa quản lý Fanpage nào hoặc không có quyền truy cập.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt Fanpage</h1>
        <p className="text-gray-500">Quản lý thông tin giới thiệu, hình ảnh và định danh của Câu lạc bộ.</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-2xl flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-bold">{message.text}</span>
        </motion.div>
      )}

      <div className="space-y-8">
        {/* Visuals Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
              Hình ảnh đại diện
            </h2>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Cover Image */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700">Ảnh bìa (Cover)</label>
              <div className="relative h-48 rounded-2xl bg-gray-100 overflow-hidden group">
                {formData.cover_url ? (
                  <img 
                    src={formData.cover_url} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <div className="bg-white p-3 rounded-full text-gray-900 shadow-lg">
                    {isUploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400">Kích thước khuyến nghị: 1200x400px. Định dạng: JPG, PNG.</p>
            </div>

            {/* Avatar Image */}
            <div className="flex items-center space-x-8">
              <div className="relative group">
                <div className="h-32 w-32 rounded-3xl bg-gray-100 border-4 border-white shadow-xl overflow-hidden">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Type className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-700 mb-1">Logo Câu lạc bộ</h3>
                <p className="text-xs text-gray-500 mb-4">Logo này sẽ hiển thị trên tất cả các bài viết và sự kiện của CLB.</p>
                <p className="text-xs text-gray-400">Kích thước khuyến nghị: 400x400px (Tỷ lệ 1:1).</p>
              </div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Thông tin giới thiệu
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Tên Câu lạc bộ / Tổ chức</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Đường dẫn (Slug)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1 italic">Dùng cho URL: utehy.social/clubs/{formData.slug || 'slug'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Mô tả giới thiệu</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                placeholder="Giới thiệu về mục tiêu, hoạt động của CLB..."
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span>Lưu tất cả thay đổi</span>
              </Button>
            </div>
          </form>
        </section>

        {/* Preview Section */}
        <section className="bg-gray-50 rounded-3xl p-8 border border-dashed border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Xem trước hiển thị
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-sm mx-auto">
            <div className="h-24 bg-gray-100 relative">
              {formData.cover_url && <img src={formData.cover_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
              <div className="absolute -bottom-6 left-4 h-16 w-16 rounded-xl bg-white p-1 shadow-md">
                <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
                  {formData.avatar_url && <img src={formData.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                </div>
              </div>
            </div>
            <div className="pt-8 pb-4 px-4">
              <h3 className="font-bold text-gray-900 truncate">{formData.name || 'Tên Câu lạc bộ'}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{formData.description || 'Chưa có mô tả giới thiệu...'}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200" />)}
                </div>
                <div className="h-6 w-16 bg-blue-600 rounded-lg" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
