import { useState, useEffect, useRef } from 'react';
import { pagesApi, type Page } from '@/api/pages.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Save,
  Loader2,
  Camera,
  Image as ImageIcon,
  Type,
  FileText,
  Link as LinkIcon,
  Globe,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

interface UploadPreview {
  file: File;
  url: string;
}

export const PageSettings = () => {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // File states
  const [avatarFile, setAvatarFile] = useState<UploadPreview | null>(null);
  const [coverFile, setCoverFile] = useState<UploadPreview | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    avatar_url: '',
    cover_url: '',
  });

  useEffect(() => {
    return () => {
      // Cleanup object URLs on unmount
      if (avatarFile?.url) URL.revokeObjectURL(avatarFile.url);
      if (coverFile?.url) URL.revokeObjectURL(coverFile.url);
    };
  }, []);

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      setIsLoading(true);

      const res = await pagesApi.getAll();
      const pagesArray: Page[] = Array.isArray(res.data.data) ? res.data.data : [];

      if (pagesArray.length === 0) {
        setIsLoading(false);
        return;
      }

      const currentUser = useAuthStore.getState().user;
      const currentPageId = currentUser?.managed_page?.id || currentUser?.page_id;

      const targetPage = currentPageId
        ? pagesArray.find((p) => p.id === currentPageId) || pagesArray[0]
        : pagesArray[0];

      if (targetPage) {
        setPage(targetPage);
        setFormData({
          name: targetPage.name || '',
          description: targetPage.description || '',
          slug: targetPage.slug || '',
          avatar_url: targetPage.avatar_url || '',
          cover_url: targetPage.cover_url || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch page data', err);
      toast.error('Không thể tải dữ liệu trang. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection - create preview URL
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous preview
    if (avatarFile) URL.revokeObjectURL(avatarFile.url);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile({ file, url: previewUrl });
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (coverFile) URL.revokeObjectURL(coverFile.url);

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCoverFile({ file, url: previewUrl });
  };

  // Remove selected file and reset preview
  const removeAvatar = () => {
    if (avatarFile) {
      URL.revokeObjectURL(avatarFile.url);
      setAvatarFile(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeCover = () => {
    if (coverFile) {
      URL.revokeObjectURL(coverFile.url);
      setCoverFile(null);
    }
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;

    setIsSaving(true);
    try {
      // Prepare update payload
      const updateData: { name: string; description: string; slug: string; avatar_url?: string; cover_url?: string } = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
      };

      // Upload avatar if new file selected
      if (avatarFile) {
        try {
          const avatarRes = await pagesApi.uploadImage(avatarFile.file);
          updateData.avatar_url = avatarRes.data.data.url;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Tải logo thất bại');
          setIsSaving(false);
          return;
        }
      }

      // Upload cover if new file selected
      if (coverFile) {
        try {
          const coverRes = await pagesApi.uploadImage(coverFile.file);
          updateData.cover_url = coverRes.data.data.url;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Tải ảnh bìa thất bại');
          setIsSaving(false);
          return;
        }
      }

      // Update page info (including new image URLs if any)
      await pagesApi.update(page.id, updateData);

      // Update local formData with new URLs (for preview)
      if (updateData.avatar_url) {
        setFormData(prev => ({ ...prev, avatar_url: updateData.avatar_url! }));
      }
      if (updateData.cover_url) {
        setFormData(prev => ({ ...prev, cover_url: updateData.cover_url! }));
      }

      // Cleanup files and previews
      if (avatarFile) {
        URL.revokeObjectURL(avatarFile.url);
        setAvatarFile(null);
      }
      if (coverFile) {
        URL.revokeObjectURL(coverFile.url);
        setCoverFile(null);
      }

      toast.success('Cập nhật Fanpage thành công!');
    } catch (err: any) {
      console.error('Failed to update page', err);
      toast.error(err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  };

  // Skeleton loader
  const ImageSkeleton = () => (
    <div className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl" />
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-48 w-full bg-gray-100 rounded-2xl animate-pulse" />
              </div>
              <div className="flex items-center space-x-8">
                <div className="h-32 w-32 rounded-3xl bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 w-full bg-gray-100 rounded-2xl animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 w-full bg-gray-100 rounded-2xl animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-32 w-full bg-gray-100 rounded-2xl animate-pulse" />
              </div>
              <div className="h-14 w-full bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6">
            <ImageIcon className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy Fanpage</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Bạn chưa quản lý Fanpage nào hoặc không có quyền truy cập. Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
        </div>
      </motion.div>
    );
  }

  // Determine which image URL to display (preview if exists, else from formData)
  const displayAvatarUrl = avatarFile?.url || formData.avatar_url;
  const displayCoverUrl = coverFile?.url || formData.cover_url;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cài đặt Fanpage</h1>
          <p className="text-gray-500 mt-1">Quản lý thông tin giới thiệu, hình ảnh và định danh của Câu lạc bộ</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-emerald-700 font-medium">Đang quản lý</span>
        </div>
      </motion.div>

      {/* Visuals Section */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 mr-3 shadow-lg shadow-emerald-200">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            Hình ảnh đại diện
          </h2>
          <p className="text-sm text-gray-500 mt-2 ml-14">
            Thay đổi ảnh bìa và logo để tạo dấu ấn riêng cho Câu lạc bộ
          </p>
        </div>

        <div className="p-8 space-y-10">
          {/* Cover Image */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-800 flex items-center">
              <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-3" />
              Ảnh bìa (Cover)
            </label>
            <div className="relative h-64 md:h-72 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden group shadow-inner">
              {displayCoverUrl ? (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={displayCoverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="h-16 w-16 mb-3 opacity-30" />
                  <span className="text-sm font-medium">Chưa có ảnh bìa</span>
                </div>
              )}

              {/* Hover overlay */}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer z-10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/95 backdrop-blur px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-800">Thay đổi ảnh bìa</span>
                </motion.div>
                <input
                  ref={coverInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleCoverSelect}
                />
              </label>

              {/* Remove button when preview exists */}
              {coverFile && (
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-4 right-4 z-20 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 ml-1">
              Khuyến nghị: 1200×400px, định dạng JPG/PNG, tối đa 5MB
            </p>
          </div>

          {/* Avatar Image */}
          <div className="flex items-start space-x-8">
            <div className="relative group flex-shrink-0">
              <div className="h-32 w-32 rounded-[1.5rem] bg-gradient-to-br from-gray-50 to-gray-100 border-4 border-white shadow-xl overflow-hidden group-hover:shadow-2xl transition-shadow duration-300">
                {displayAvatarUrl ? (
                  <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={displayAvatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Type className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Avatar upload button */}
              <label className="absolute -bottom-2 -right-2 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 z-10">
                <Camera className="h-5 w-5" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                />
              </label>

              {/* Remove button when preview exists */}
              {avatarFile && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 z-20 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex-1 pt-2">
              <h3 className="text-base font-bold text-gray-800 mb-2">
                Logo Câu lạc bộ
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                Logo này sẽ hiển thị trên tất cả các bài viết, sự kiện và thông báo của Câu lạc bộ.
              </p>
              <div className="inline-flex items-center px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                <span className="text-xs font-medium text-emerald-700">
                  Khuyến nghị: 400×400px (tỷ lệ 1:1)
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Info Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-lg overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 mr-3 shadow-lg shadow-emerald-200">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Thông tin giới thiệu
          </h2>
          <p className="text-sm text-gray-500 mt-2 ml-14">
            Cập nhật thông tin cơ bản để người dùng dễ dàng tìm hiểu về Câu lạc bộ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Club Name */}
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-gray-800 flex items-center ml-1">
                <Type className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                Tên Câu lạc bộ / Tổ chức
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="Nhập tên CLB..."
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-gray-800 flex items-center ml-1">
                <LinkIcon className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                Đường dẫn (Slug)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="ten-clb"
                required
              />
              <p className="text-[10px] text-gray-400 ml-1 italic font-mono">
                URL: utehy.social/clubs/
                <span className="text-emerald-600 font-semibold">
                  {formData.slug || 'ten-clb'}
                </span>
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-gray-800 flex items-center ml-1">
              <FileText className="h-3.5 w-3.5 mr-2 text-emerald-600" />
              Mô tả giới thiệu
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all resize-none placeholder:text-gray-400"
              placeholder="Giới thiệu về mục tiêu, hoạt động, tầm nhìn của CLB..."
            />
            <p className="text-xs text-gray-400 ml-1">
              {formData.description.length > 0
                ? `${formData.description.length} ký tự`
                : 'Tối thiểu 50 ký tự'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-3 transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang lưu...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-5 w-5" />
                    <span>Lưu tất cả thay đổi</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </form>
      </motion.section>

      {/* Preview Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-8 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center">
            <Globe className="h-4 w-4 mr-2 text-emerald-600" />
            Xem trước hiển thị
          </h2>
          <span className="text-xs font-medium px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            Trang cá nhân công khai
          </span>
        </div>

        <div className="flex justify-center">
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-sm w-full hover:shadow-2xl transition-shadow"
          >
            {/* Cover */}
            <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 relative overflow-hidden">
              {displayCoverUrl ? (
                <img
                  src={displayCoverUrl}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100" />
              )}

              {/* Avatar overlay */}
              <div className="absolute -bottom-8 left-4 h-16 w-16 rounded-xl bg-white p-1 shadow-lg border-2 border-white">
                <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50">
                  {displayAvatarUrl ? (
                    <img
                      src={displayAvatarUrl}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
                      <Type className="h-6 w-6 text-emerald-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="pt-10 pb-5 px-5">
              <h3 className="font-bold text-gray-900 truncate text-lg">
                {formData.name || 'Tên Câu lạc bộ'}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed min-h-[2.5rem]">
                {formData.description || 'Chưa có mô tả giới thiệu...'}
              </p>

              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                {/* Members */}
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 ring-1 ring-gray-100"
                    />
                  ))}
                  <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300 bg-transparent flex items-center justify-center">
                    <span className="text-[8px] font-medium text-gray-500">+24</span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="h-8 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center">
                  <span className="text-xs font-bold text-white">Theo dõi</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
};
