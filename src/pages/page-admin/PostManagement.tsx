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
  Upload
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
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); // For edit mode

  useEffect(() => {
    fetchInitialData();

    // Cleanup on unmount
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

   // Cleanup when modal closes (single effect using functional updates)
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
        // Sort by created_at (newest first)
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
    // Cleanup any existing preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImageUrls([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: any) => {
    setEditingPost(post);
    setFormData({ content: post.content });
    // Cleanup any existing preview URLs
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

  // Image file selection handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    // Validate file types
    const invalidFiles = newFiles.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }

    // Validate total count (max 10)
    if (selectedFiles.length + newFiles.length > 10) {
      toast.error('Tối đa 10 ảnh mỗi bài viết');
      return;
    }

    // Clean up any previous previews for these indices if replacing? Actually newFiles are added
    // Create preview URLs for new files
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    // Reset input value so same file can be selected again if needed
    e.target.value = '';
  };

  // Remove a selected file (by index in selectedFiles array)
  const handleRemoveFile = (index: number) => {
    // Revoke the object URL to avoid memory leak
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing image (in edit mode) from existingImageUrls array
  const handleRemoveExistingImage = (url: string) => {
    setExistingImageUrls(prev => prev.filter(u => u !== url));
  };

  // Submit: upload images one by one, then create post
  // Submit using FormData with multipart for file uploads
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

      // Append selected image files (if any)
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

      // Cleanup previews and close
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
        <p className="text-gray-500">Bạn chưa quản lý Fanpage nào để quản lý bài viết.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Bài viết</h1>
          <p className="text-gray-500 text-sm">Tạo và quản lý các bài đăng trên bảng tin của {page?.name}.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center space-x-2 rounded-2xl px-6 bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-5 w-5" />
          <span>Tạo bài viết mới</span>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <motion.div
              layout
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-blue-100 transition-all group"
            >
              <div className="flex-1">
                {/* Author info */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {post.page?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{post.page?.name || 'UTEHY'}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(post.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-800 text-sm line-clamp-3 mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {post.image_urls.slice(0, 6).map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Post"
                        className="w-full aspect-square object-cover rounded-xl border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-6 text-xs font-bold">
                  <div className="flex items-center text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
                    <Heart className="h-4 w-4 mr-1.5 fill-current" />
                    <span>{post._count?.likes || 0}</span>
                  </div>
                  <div className="flex items-center text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    <span>{post._count?.comments || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEditModal(post)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">Chưa có bài viết nào trên bảng tin.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Nội dung bài viết</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    placeholder="Bạn đang nghĩ gì? Chia sẻ thông tin mới nhất đến sinh viên..."
                    required
                  />
                </div>

                {/* Multi-image upload section */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 ml-1">Hình ảnh (Tối đa 10 ảnh)</label>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="post-images-input"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  {/* Trigger button */}
                  <label
                    htmlFor="post-images-input"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                  >
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Upload className="h-5 w-5" />
                      <span className="font-bold">Chọn ảnh</span>
                    </div>
                  </label>

                  {/* Preview Grid */}
                  {(previewUrls.length > 0 || existingImageUrls.length > 0) && (
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {/* New file previews */}
                      {previewUrls.map((url, idx) => (
                        <div key={`preview-${idx}`} className="relative aspect-square group">
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {/* Existing image URLs (edit mode) */}
                      {existingImageUrls.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative aspect-square group">
                          <img
                            src={url}
                            alt={`Existing ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl border border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(url)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 ml-1">
                    Đã chọn {selectedFiles.length} ảnh mới. Tổng cộng: {selectedFiles.length + existingImageUrls.length} ảnh.
                  </p>
                </div>

                <div className="pt-4 flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Cleanup previews before closing
                      previewUrls.forEach(url => URL.revokeObjectURL(url));
                      setIsModalOpen(false);
                    }}
                    className="flex-1 py-4 rounded-2xl border-gray-200"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isActionLoading}
                    className="flex-2 py-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600"
                  >
                    {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span>{editingPost ? 'Cập nhật bài viết' : 'Đăng bài viết'}</span>
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
        title="Xác nhận xóa bài viết"
        description="Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
        confirmText="Xóa bài viết"
      />
    </div>
  );
};
