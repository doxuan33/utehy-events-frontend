import { useState, useEffect } from 'react';
import { postsApi } from '@/api/posts.api';
import { pagesApi } from '@/api/pages.api';
import { BASE_URL } from '@/api/client';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  MessageSquare,
  Heart,
  Loader2,
  AlertCircle,
  X,
  Send,
  Calendar,
  Upload,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/store/auth.store';

export const PostManagement = () => {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    content: '',
  });

  // Multi-image state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      setPreviewUrls(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      setSelectedFiles([]);
      setExistingImageUrls([]);
    }
  }, [isModalOpen]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const pagesRes = await pagesApi.getAll();
      const managedPage = pagesRes.data.data?.[0];

      if (managedPage) {
        setPage(managedPage);
        const postsRes = await postsApi.getNewsfeed({ page_id: managedPage.id, limit: 50 });
        const rawPosts = postsRes.data.data.data || [];
        const sortedPosts = rawPosts.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.id).getTime();
          const dateB = new Date(b.created_at || b.id).getTime();
          return dateB - dateA;
        });
        setPosts(sortedPosts);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setFormData({ content: '' });
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImageUrls([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: any) => {
    setEditingPost(post);
    setFormData({ content: post.content });
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImageUrls(post.image_urls || []);
    setIsModalOpen(true);
  };

  const handleDeletePost = (id: string) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setShowConfirmDialog(false);
    try {
      setIsActionLoading(true);
      await postsApi.delete(deleteId);
      setPosts(posts.filter(p => p.id !== deleteId));
      toast.success('Đã xóa bài viết');
    } catch (err) {
      console.error('Failed to delete post', err);
      toast.error('Xóa bài viết thất bại.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const invalidFiles = newFiles.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }

    if (selectedFiles.length + newFiles.length > 10) {
      toast.error('Tối đa 10 ảnh mỗi bài viết');
      return;
    }

    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (url: string) => {
    setExistingImageUrls(prev => prev.filter(u => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    try {
      setIsActionLoading(true);
      toast.loading('Đang xử lý...', { id: 'post-submit' });

      const formPayload = new FormData();
      formPayload.append('page_id', page.id);
      formPayload.append('content', formData.content);

      selectedFiles.forEach(file => {
        formPayload.append('images', file);
      });

      const url = editingPost ? `${BASE_URL}/posts/${editingPost.id}` : `${BASE_URL}/posts`;
      const method = editingPost ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: formPayload,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || (editingPost ? 'Cập nhật thất bại' : 'Đăng bài thất bại'));

      if (editingPost) {
        setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...data.data } : p));
        toast.success('Cập nhật bài viết thành công!', { id: 'post-submit' });
      } else {
        setPosts([data.data, ...posts]);
        toast.success('Đăng bài viết thành công!', { id: 'post-submit' });
      }

      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setExistingImageUrls([]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save post', err);
      toast.error(err.message || 'Lưu bài viết thất bại.', { id: 'post-submit' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Vùng chứa toàn bộ component - Gradient nền hiện đại
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-white p-2 md:p-6 space-y-8 rounded-[2.5rem]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight flex items-center gap-2">
            Quản lý Bài viết <Sparkles className="h-6 w-6 text-emerald-500" />
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            Quản trị và lan tỏa thông điệp trên không gian mạng của <span className="text-emerald-600 font-bold">{page?.name || 'Fanpage'}</span>
          </p>
        </div>
        
        <Button 
          onClick={handleOpenCreateModal} 
          className="group relative overflow-hidden flex items-center space-x-2 rounded-2xl px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border-none"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <Plus className="h-5 w-5 relative z-10" />
          <span className="font-bold tracking-wide relative z-10">Tạo bài viết mới</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-emerald-100"></div>
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 absolute top-0 left-0" />
          </div>
          <p className="text-emerald-600 font-medium animate-pulse">Đang đồng bộ dữ liệu...</p>
        </div>
      ) : !page ? (
        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-12 text-center border border-white/50 shadow-xl shadow-emerald-900/5">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy Fanpage</h3>
          <p className="text-gray-500">Hệ thống chưa ghi nhận Fanpage nào dưới quyền quản lý của bạn.</p>
        </div>
      ) : (
        <>
          {/* Search Bar - Glassmorphism */}
          <div className="bg-white/70 backdrop-blur-md p-2 rounded-[2rem] shadow-lg shadow-emerald-900/5 border border-white/60 relative z-10 group transition-all focus-within:shadow-emerald-500/10 focus-within:bg-white">
            <div className="relative flex items-center">
              <div className="absolute left-6 bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-xl text-white shadow-md group-focus-within:scale-110 transition-transform">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Khám phá và tìm kiếm nội dung bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-20 pr-6 py-4 bg-transparent border-none rounded-[2rem] text-gray-700 font-medium focus:outline-none focus:ring-0 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  key={post.id}
                  className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Decorative background blob */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

                  <div className="flex-1 relative z-10">
                    {/* Header: Author & Time */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-400 blur-md opacity-40 rounded-full"></div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-lg relative z-10 border-2 border-white shadow-sm">
                            {post.page?.name?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 tracking-tight">{post.page?.name || 'UTEHY'}</p>
                          <div className="flex items-center space-x-1.5 text-xs text-emerald-600/80 font-medium mt-0.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(new Date(post.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons moved to top right */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-2xl p-1.5 shadow-sm border border-gray-100">
                        <button
                          onClick={() => handleOpenEditModal(post)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-[15px] leading-relaxed line-clamp-4 mb-6 whitespace-pre-wrap font-medium">
                      {post.content}
                    </p>

                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {post.image_urls.slice(0, 6).map((url: string, idx: number) => (
                          <div key={idx} className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 border border-gray-100/50 group/img">
                            <img
                              src={url}
                              alt="Post"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            {idx === 5 && post.image_urls.length > 6 && (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{post.image_urls.length - 6}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm font-bold pt-4 border-t border-gray-100/60">
                      <div className="flex items-center text-pink-500 bg-pink-50/50 px-4 py-2 rounded-2xl border border-pink-100/50">
                        <Heart className="h-4 w-4 mr-2 fill-current" />
                        <span>{post._count?.likes || 0}</span>
                      </div>
                      <div className="flex items-center text-teal-600 bg-teal-50/50 px-4 py-2 rounded-2xl border border-teal-100/50">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span>{post._count?.comments || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-1 lg:col-span-2 bg-white/50 backdrop-blur-xl rounded-[3rem] p-16 text-center border-2 border-dashed border-emerald-200">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-500">Hãy là người đầu tiên chia sẻ thông tin trên bảng tin.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Modal - Modernized */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-transparent">
                <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                  {editingPost ? 'Cập nhật nội dung' : 'Sáng tạo bài viết'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 bg-gray-100/50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all group"
                >
                  <X className="h-5 w-5 text-gray-500 group-hover:text-red-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 ml-2 flex items-center gap-2">
                    Nội dung <Sparkles className="h-3 w-3 text-emerald-500" />
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={5}
                    className="w-full px-6 py-5 bg-gray-50/50 border border-gray-200/60 rounded-[2rem] text-[15px] font-medium text-gray-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all resize-none shadow-inner"
                    placeholder="Bạn đang nghĩ gì? Chia sẻ thông tin mới nhất đến cộng đồng sinh viên..."
                    required
                  />
                </div>

                {/* Multi-image upload section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-2">
                    <label className="text-sm font-bold text-gray-700">Đính kèm Media</label>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      Tối đa 10 ảnh
                    </span>
                  </div>

                  <input
                    type="file"
                    id="post-images-input"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  <label
                    htmlFor="post-images-input"
                    className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-emerald-200/80 rounded-[2rem] bg-emerald-50/30 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 text-emerald-500" />
                    </div>
                    <span className="font-bold text-emerald-700">Tải ảnh lên</span>
                    <span className="text-sm text-gray-400 mt-1">Hỗ trợ JPG, PNG, WebP</span>
                  </label>

                  {/* Preview Grid */}
                  {(previewUrls.length > 0 || existingImageUrls.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-6">
                      {previewUrls.map((url, idx) => (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} key={`preview-${idx}`} className="relative aspect-square group rounded-2xl overflow-hidden shadow-sm">
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {existingImageUrls.map((url, idx) => (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} key={`existing-${idx}`} className="relative aspect-square group rounded-2xl overflow-hidden shadow-sm">
                          <img
                            src={url}
                            alt={`Existing ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(url)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 ml-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <p className="text-xs font-medium text-gray-500">
                      Tổng số ảnh đính kèm: <span className="font-bold text-gray-800">{selectedFiles.length + existingImageUrls.length}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-6 flex space-x-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      previewUrls.forEach(url => URL.revokeObjectURL(url));
                      setIsModalOpen(false);
                    }}
                    className="flex-1 py-4 rounded-[1.5rem] border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={isActionLoading}
                    className="flex-[2] py-4 rounded-[1.5rem] shadow-[0_0_20px_rgba(16,185,129,0.3)] border-none flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg hover:scale-[1.02] transition-transform"
                  >
                    {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span>{editingPost ? 'Lưu thay đổi' : 'Phát sóng bài viết'}</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa bài viết?"
        description="Dữ liệu và tương tác của bài viết này sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Đồng ý xóa"
      />
    </div>
  );
};